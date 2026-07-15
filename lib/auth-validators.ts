// ─── Auth Form Validators ────────────────────────────────────────────────────

export type ValidationResult = {
  valid: boolean;
  error: string;
};

// ─── Email ───────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { valid: false, error: "Email is required." };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: "Please enter a valid email address." };
  }
  return { valid: true, error: "" };
}

// ─── Password ────────────────────────────────────────────────────────────────

export interface PasswordRequirement {
  label: string;
  met: boolean;
}

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a letter", met: /[a-zA-Z]/.test(password) },
    { label: "Contains a number", met: /[0-9]/.test(password) },
    { label: "Contains a special character", met: /[^a-zA-Z0-9]/.test(password) },
  ];
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: "Password is required." };
  }
  const requirements = getPasswordRequirements(password);
  const unmet = requirements.filter((r) => !r.met);
  if (unmet.length > 0) {
    return { valid: false, error: unmet[0].label + "." };
  }
  return { valid: true, error: "" };
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (!confirmPassword) {
    return { valid: false, error: "Please confirm your password." };
  }
  if (password !== confirmPassword) {
    return { valid: false, error: "Passwords do not match." };
  }
  return { valid: true, error: "" };
}

// ─── Password Strength ──────────────────────────────────────────────────────

export type PasswordStrength = {
  score: number; // 0-4
  label: string;
  color: string;
};

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;

  const levels: PasswordStrength[] = [
    { score: 0, label: "Too short", color: "#EF4444" },
    { score: 1, label: "Weak", color: "#F97316" },
    { score: 2, label: "Fair", color: "#EAB308" },
    { score: 3, label: "Strong", color: "#22C55E" },
    { score: 4, label: "Very strong", color: "#15803D" },
  ];

  return levels[score];
}

// ─── Name ────────────────────────────────────────────────────────────────────

export function validateName(name: string): ValidationResult {
  if (!name.trim()) {
    return { valid: false, error: "Name is required." };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: "Name must be at least 2 characters." };
  }
  return { valid: true, error: "" };
}
