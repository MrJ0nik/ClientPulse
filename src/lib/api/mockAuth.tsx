import { User } from "@/src/lib/features/auth/authSlice";

const MOCK_DB = {
  "user@gmail.com": "admin123",
  "demo@test.com": "123456",
};

export const loginAPI = (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    const delay = Math.floor(Math.random() * 1000) + 500;

    setTimeout(() => {
      const storedPassword = MOCK_DB[email as keyof typeof MOCK_DB];

      if (storedPassword && storedPassword === password) {
        resolve({
          id: "1",
          name: "Ivan",
          email: email,
          avatar:
            "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-7.png",
        });
      } else {
        reject(new Error("Invalid email or password"));
      }
    }, delay);
  });
};

export const registerAPI = (
  name: string,
  email: string,
  password: string,
): Promise<User> => {
  return new Promise((resolve, reject) => {
    const delay = Math.floor(Math.random() * 1000) + 500;

    setTimeout(() => {
      if (Object.keys(MOCK_DB).includes(email)) {
        reject(new Error("This email is already registered"));
        return;
      }

      resolve({
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        email: email,
        avatar:
          "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-1.png",
      });
    }, delay);
  });
};
