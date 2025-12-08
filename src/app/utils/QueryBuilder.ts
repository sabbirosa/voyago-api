import { excludeField } from "../constants";

type WhereInput = any; // Prisma where input type
type OrderByInput = any; // Prisma orderBy input type

export class QueryBuilder {
  private where: WhereInput = {};
  private orderBy: OrderByInput = {};
  private skip: number = 0;
  private take: number = 10;
  private select: any = undefined;
  private include: any = undefined;
  private readonly query: Record<string, string>;
  private readonly model: {
    findMany: (args?: any) => Promise<any[]>;
    count: (args?: any) => Promise<number>;
  };

  constructor(
    model: {
      findMany: (args?: any) => Promise<any[]>;
      count: (args?: any) => Promise<number>;
    },
    query: Record<string, string>
  ) {
    this.model = model;
    this.query = query;
  }

  /**
   * Apply filters from query parameters
   * Excludes reserved fields like page, limit, search, sort, etc.
   */
  filter(defaultFilters?: WhereInput): this {
    const filter: any = { ...defaultFilters };

    // Copy all query params except reserved fields
    for (const [key, value] of Object.entries(this.query)) {
      if (!excludeField.includes(key) && value !== undefined && value !== null && value !== "") {
        // Handle special filter cases
        if (key === "minPrice" || key === "maxPrice") {
          // Price range filtering
          if (!filter.tourFee) filter.tourFee = {};
          if (key === "minPrice") {
            filter.tourFee.gte = Number(value);
          } else {
            filter.tourFee.lte = Number(value);
          }
        } else if (key === "language") {
          // Array contains filter
          filter.languages = { has: value };
        } else if (key === "city" || key === "country") {
          // Text search with case-insensitive
          filter[key] = {
            contains: value,
            mode: "insensitive",
          };
        } else if (key === "isActive" || key === "isRecurring" || key === "isApproved" || key === "isBanned" || key === "isEmailVerified") {
          // Boolean fields - convert string to boolean
          filter[key] = value === "true";
        } else {
          // Direct field filter
          filter[key] = value;
        }
      }
    }

    this.where = { ...this.where, ...filter };
    return this;
  }

  /**
   * Apply search across multiple fields
   */
  search(searchableFields: string[]): this {
    const searchTerm = this.query.search || this.query.searchTerm || "";
    if (searchTerm) {
      const searchConditions = searchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" as const },
      }));

      // If there's already an OR condition, merge it
      if (this.where.OR) {
        this.where.OR = [...(this.where.OR as any[]), ...searchConditions];
      } else {
        this.where.OR = searchConditions;
      }
    }
    return this;
  }

  /**
   * Apply sorting
   * Supports sortBy and sortOrder query params, or a single "sort" param
   */
  sort(defaultSort: any = { createdAt: "desc" }): this {
    if (this.query.sortBy) {
      const sortOrder = this.query.sortOrder === "asc" ? "asc" : "desc";
      const sortField = this.query.sortBy;
      
      // Map frontend field names to database fields if needed
      const fieldMap: Record<string, string> = {
        price: "tourFee",
        rating: "avgRating",
      };
      
      const dbField = fieldMap[sortField] || sortField;
      this.orderBy = { [dbField]: sortOrder };
    } else if (this.query.sort) {
      // Handle single sort param like "-createdAt" or "createdAt"
      const sort = this.query.sort;
      const isDesc = sort.startsWith("-");
      const field = isDesc ? sort.substring(1) : sort;
      this.orderBy = { [field]: isDesc ? "desc" : "asc" };
    } else {
      this.orderBy = defaultSort;
    }
    return this;
  }

  /**
   * Apply field selection (projection)
   */
  fields(): this {
    const fields = this.query.fields;
    if (fields) {
      const fieldArray = fields.split(",");
      this.select = fieldArray.reduce((acc, field) => {
        acc[field.trim()] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    return this;
  }

  /**
   * Apply pagination
   */
  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    this.skip = (page - 1) * limit;
    this.take = limit;
    return this;
  }

  /**
   * Set include relations
   */
  includeRelations(include: any): this {
    this.include = include;
    return this;
  }

  /**
   * Build and execute the query
   */
  async build(): Promise<any[]> {
    const args: any = {
      where: this.where,
      orderBy: this.orderBy,
      skip: this.skip,
      take: this.take,
    };

    if (this.select) {
      args.select = this.select;
    }

    if (this.include) {
      args.include = this.include;
    }

    return this.model.findMany(args);
  }

  /**
   * Get pagination metadata
   */
  async getMeta(): Promise<{
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  }> {
    const total = await this.model.count({ where: this.where });
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return { page, limit, total, totalPage };
  }

  /**
   * Get the where clause (useful for debugging or custom queries)
   */
  getWhere(): WhereInput {
    return this.where;
  }
}

