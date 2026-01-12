// Generic Interfaces based on common healthcare data structures

export interface PaginationEnvelope<T> {
  total: number;
  limit: number;
  offset: number;
  results: T[];
}

export interface DiagnosticTest {
  // Identification
  id: string | number;
  test_code: string;
  test_name: string;
  category?: string;
  status?: string;

  // Pricing & TAT
  mrp: number;
  tat?: string;
  test_processingday_day?: string;
  test_processingday_dayType?: string;
  LogisticTat?: string;
  reportDelivery_days?: string;
  booking_cutoff?: string;
  sra_cutoff?: string;
  reporting_cutoff?: string;
  last_tat_modified_date?: string;
  last_tat_modified_by?: string;

  // Specimen & Pre-analytics
  specimenId?: string;
  sampleType_name?: string;
  specimen_remarks?: string;
  container?: string;
  temp?: string;
  cut_off?: string;
  color_name?: string;

  // Clinical Context
  diseaseId?: string;
  disease_name?: string;
  department?: string; // Often used for display/query
  department_name?: string;
  methodology?: string;

  // Operational Metadata
  frequency?: string;
  test_centre?: string;
  centre_name?: string;
  processing_lab?: string;
  outSource_lab?: string;
  In_Out_House?: string;

  // Audit
  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
}

export interface DiagnosticCenter {
  // Matches GET /centers
  city_name: string;
  center_code: string;
}

export interface PricingEntry {
  // Matches GET /pricing/enriched
  test_code: string;
  test_name: string;
  department: string;
  city: string;
  mrp: string;
  tat: string;
}

export interface OverviewItem {
  // Matches GET /overview
  label: string;
  value: number;
}
