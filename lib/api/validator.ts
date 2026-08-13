import { ApiError } from './errors';

type ValidationRule = {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  minLength?: number;
  maxLength?: number;
  allowedValues?: unknown[];
};

type Schema = Record<string, ValidationRule>;

export function validateRequest(data: unknown, schema: Schema) {
  if (!data || typeof data !== 'object') {
    throw new ApiError('Invalid request body', 'VALIDATION_ERROR', 400);
  }

  for (const [field, rules] of Object.entries(schema)) {
    const value = (data as Record<string, unknown>)[field];

    if (rules.required && (value === undefined || value === null || value === '')) {
      throw new ApiError(`Field '${field}' is required`, 'VALIDATION_ERROR', 400);
    }

    if (value !== undefined && value !== null) {
      if (rules.type) {
        if (rules.type === 'array' && !Array.isArray(value)) {
          throw new ApiError(`Field '${field}' must be an array`, 'VALIDATION_ERROR', 400);
        } else if (rules.type !== 'array' && typeof value !== rules.type) {
          throw new ApiError(`Field '${field}' must be of type ${rules.type}`, 'VALIDATION_ERROR', 400);
        }
      }

      if (rules.type === 'string') {
        if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
          throw new ApiError(`Field '${field}' must be at least ${rules.minLength} characters long`, 'VALIDATION_ERROR', 400);
        }
        if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
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
