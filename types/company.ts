export interface Company {
  id: number;
  name: string;
  category: string;
  city: string;
  province: string;
  website?: string;
  whatsapp?: string;
  email?: string;
  score: number;
}