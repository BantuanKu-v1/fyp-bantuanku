export type EligibilityProgramCode = "BAT" | "BPT";
export type EligibilityQuestionType = "boolean" | "number" | "date" | "select";

export interface EligibilityQuestionOption {
  label: string;
  value: string;
}

export interface EligibilityQuestionCondition {
  field: string;
  equals: string | boolean;
}

export interface EligibilityQuestion {
  id: string;
  programCode: EligibilityProgramCode;
  field: string;
  label: string;
  description?: string;
  type: EligibilityQuestionType;
  required: boolean;
  options?: EligibilityQuestionOption[];
  showWhen?: EligibilityQuestionCondition;

  // Optional presentation and validation metadata
  inputMode?: "currency" | "integer" | "decimal";
  min?: number;
  max?: number;
  decimalPlaces?: number;
  allowFutureDate?: boolean;
}
