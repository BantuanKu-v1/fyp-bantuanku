export type EligibilityQuestionType =
    | "boolean"
    | "number"
    | "date"
    | "select";

export interface EligibilityQuestion {
  id: string;
  programCode: "BAT" | "BPT";
  field: string;
  label: string;
  description?: string;
  type: EligibilityQuestionType;
  required: boolean;
  options?: {
    label: string;
    value: string;
  }[];
  showWhen?: {
    field: string;
    equals: string | boolean;
  };
}
