import { ApiError } from './errors';

export type ValidationRule = {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  minLength?: number;
  maxLength?: number;
  allowedValues?: unknown[];
  nullable?: boolean;
};

export type Schema = Record<string, ValidationRule>;

export type ValidationOptions = {
  allowUnknown?: boolean;
  requireAtLeastOne?: boolean;
};

export function validateRequest(
  data: unknown,
  schema: Schema,
  options: ValidationOptions = { allowUnknown: true, requireAtLeastOne: false }
) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ApiError('Invalid request body', 'VALIDATION_ERROR', 400);
  }

  const obj = data as Record<string, unknown>;
  const keys = Object.keys(obj);

  // Check for unexpected fields if allowUnknown is explicitly false
  if (options.allowUnknown === false) {
    for (const key of keys) {
      if (!(key in schema)) {
        throw new ApiError(`Unexpected field '${key}'`, 'VALIDATION_ERROR', 400);
      }
    }
  }

  // Check if at least one valid field is provided
  if (options.requireAtLeastOne) {
    const presentFields = keys.filter((k) => obj[k] !== undefined);
    if (presentFields.length === 0) {
      throw new ApiError('At least one field must be provided', 'VALIDATION_ERROR', 400);
    }
  }

  for (const [field, rules] of Object.entries(schema)) {
    const value = obj[field];

    if (rules.required && (value === undefined || value === null || value === '')) {
      throw new ApiError(`Field '${field}' is required`, 'VALIDATION_ERROR', 400);
    }

    if (value !== undefined) {
      if (value === null) {
        if (!rules.nullable && rules.required) {
          throw new ApiError(`Field '${field}' cannot be null`, 'VALIDATION_ERROR', 400);
        }
        continue;
      }

      if (rules.type) {
        if (rules.type === 'array' && !Array.isArray(value)) {
          throw new ApiError(`Field '${field}' must be an array`, 'VALIDATION_ERROR', 400);
        } else if (rules.type !== 'array' && typeof value !== rules.type) {
          throw new ApiError(`Field '${field}' must be of type ${rules.type}`, 'VALIDATION_ERROR', 400);
        }
      }

      if (rules.type === 'string') {
        if (rules.minLength !== undefined && typeof value === 'string' && value.length < rules.minLength) {
          throw new ApiError(`Field '${field}' must be at least ${rules.minLength} characters long`, 'VALIDATION_ERROR', 400);
        }
        if (rules.maxLength !== undefined && typeof value === 'string' && value.length > rules.maxLength) {
          throw new ApiError(`Field '${field}' must be at most ${rules.maxLength} characters long`, 'VALIDATION_ERROR', 400);
        }
      }

      if (rules.allowedValues && !rules.allowedValues.includes(value)) {
        throw new ApiError(`Field '${field}' must be one of: ${rules.allowedValues.join(', ')}`, 'VALIDATION_ERROR', 400);
      }
    }
  }

  return data;
}
