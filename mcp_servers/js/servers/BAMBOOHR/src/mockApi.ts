export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
}

let employees: Employee[] = [
  { id: 1, firstName: "John", lastName: "Doe", email: "john.doe@example.com", jobTitle: "Developer" },
  { id: 2, firstName: "Jane", lastName: "Smith", email: "jane.smith@example.com", jobTitle: "Manager" },
];

export const mockBambooHRApi = {
  getEmployee: async (id: number): Promise<Employee | null> => {
    return employees.find(emp => emp.id === id) || null;
  },
  getAllEmployees: async (): Promise<Employee[]> => {
    return employees;
  },
  createEmployee: async (data: Omit<Employee, 'id'>): Promise<number> => {
    const newEmployee: Employee = { id: employees.length + 1, ...data };
    employees.push(newEmployee);
    return newEmployee.id;
  },
};
