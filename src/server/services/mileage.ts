export type MileageResult = {
  applicable: boolean;
  message: string;
  originalValues: Array<{ concept: string; amount: number; currency: string }>;
  adjustedValues?: Array<{
    concept: string;
    originalAmount: number;
    adjustedAmount: number;
    currency: string;
  }>;
  mileage?: number;
};

export function calculateMileageAdjustment(
  economicValues: Array<{ concept: string; amount: number; currency: string }>,
  mileage: number,
  _source: "ebc" | "lobato",
): MileageResult {
  if (economicValues.length === 0) {
    return {
      applicable: false,
      message: "Esta edición no incluye valores económicos para ajustar.",
      originalValues: [],
    };
  }

  if (!Number.isFinite(mileage) || mileage < 0) {
    return {
      applicable: false,
      message: "Kilometraje inválido.",
      originalValues: economicValues,
    };
  }

  return {
    applicable: false,
    message:
      "Esta edición no proporciona una regla de kilometraje aplicable para este vehículo.",
    originalValues: economicValues,
    mileage,
  };
}
