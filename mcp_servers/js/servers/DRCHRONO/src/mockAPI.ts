import * as faker from 'faker';

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  dateTime: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  reason: string;
}

export interface ClinicalNote {
  id: number;
  patientId: number;
  appointmentId: number;
  note: string;
  createdAt: string;
}

export interface BillingRecord {
  id: number;
  patientId: number;
  appointmentId: number;
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  invoiceDate: string;
}

let patients: Patient[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  dateOfBirth: faker.date.past(50).toISOString().split('T')[0],
  gender: faker.random.arrayElement(['Male', 'Female', 'Other']),
}));

let appointments: Appointment[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  patientId: faker.datatype.number({ min: 1, max: 10 }),
  doctorId: faker.datatype.number({ min: 1, max: 5 }),
  dateTime: faker.date.future().toISOString(),
  status: faker.random.arrayElement(['Scheduled', 'Completed', 'Cancelled']),
  reason: faker.lorem.sentence(),
}));

let clinicalNotes: ClinicalNote[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  patientId: faker.datatype.number({ min: 1, max: 10 }),
  appointmentId: faker.datatype.number({ min: 1, max: 20 }),
  note: faker.lorem.paragraph(),
  createdAt: faker.date.recent().toISOString(),
}));

let billingRecords: BillingRecord[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  patientId: faker.datatype.number({ min: 1, max: 10 }),
  appointmentId: faker.datatype.number({ min: 1, max: 20 }),
  amount: faker.datatype.number({ min: 50, max: 500 }),
  status: faker.random.arrayElement(['Pending', 'Paid', 'Overdue']),
  invoiceDate: faker.date.past().toISOString().split('T')[0],
}));

export const mockDrChronoApi = {
  getPatient: async (id: number): Promise<Patient | null> => {
    return patients.find(p => p.id === id) || null;
  },
  getAllPatients: async (): Promise<Patient[]> => {
    return patients;
  },
  createPatient: async (data: Omit<Patient, 'id'>): Promise<number> => {
    const newPatient = { id: patients.length + 1, ...data };
    patients.push(newPatient);
    return newPatient.id;
  },
  updatePatient: async (id: number, data: Partial<Patient>): Promise<void> => {
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Patient not found');
    patients[index] = { ...patients[index], ...data };
  },
  deletePatient: async (id: number): Promise<void> => {
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Patient not found');
    patients.splice(index, 1);
  },
  getAppointment: async (id: number): Promise<Appointment | null> => {
    return appointments.find(a => a.id === id) || null;
  },
  getAllAppointments: async (): Promise<Appointment[]> => {
    return appointments;
  },
  createAppointment: async (data: Omit<Appointment, 'id'>): Promise<number> => {
    const newAppointment = { id: appointments.length + 1, ...data };
    appointments.push(newAppointment);
    return newAppointment.id;
  },
  updateAppointment: async (id: number, data: Partial<Appointment>): Promise<void> => {
    const index = appointments.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Appointment not found');
    appointments[index] = { ...appointments[index], ...data };
  },
  getClinicalNote: async (id: number): Promise<ClinicalNote | null> => {
    return clinicalNotes.find(n => n.id === id) || null;
  },
  createClinicalNote: async (data: Omit<ClinicalNote, 'id'>): Promise<number> => {
    const newNote = { id: clinicalNotes.length + 1, ...data };
    clinicalNotes.push(newNote);
    return newNote.id;
  },
  getBillingRecord: async (id: number): Promise<BillingRecord | null> => {
    return billingRecords.find(b => b.id === id) || null;
  },
  createBillingRecord: async (data: Omit<BillingRecord, 'id'>): Promise<number> => {
    const newRecord = { id: billingRecords.length + 1, ...data };
    billingRecords.push(newRecord);
    return newRecord.id;
  },
};