export interface User {
  id: number;
  name: string;
  email: string;
}

export class UserService {
  private users: User[] = [];

  getUser(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  addUser(user: User): void {
    this.users.push(user);
  }

  deleteUser(id: number): void {
    this.users = this.users.filter(u => u.id !== id);
  }
}
