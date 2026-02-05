"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Container,
  Anchor,
  Alert,
} from "@mantine/core";
import { CircleAlert } from "lucide-react";
import { setCredentials } from "@/src/lib/features/auth/authSlice";
import { loginAPI } from "@/src/lib/api/mockAuth";
import classes from "./page.module.css";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginAPI(email, password);

      document.cookie =
        "access_token=mock_jwt_token; path=/; max-age=86400; SameSite=Lax";

      dispatch(setCredentials({ user }));
      router.push("/Home");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Something went wrong");
      } else {
        setError("Something went wrong");
      }
      setLoading(false);
    }
  };

  return (
    <div className={classes.wrapper}>
      <Container size={420} my={40}>
        <Title ta="center" className={classes.title}>
          ClientPulse
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          Welcome back to the Growth Engine
        </Text>

        <Paper
          withBorder
          shadow="md"
          p={30}
          mt={30}
          radius="md"
          className={classes.paper}
        >
          <form onSubmit={handleLogin}>
            {error && (
              <Alert
                variant="light"
                color="red"
                title="Authorization Error"
                icon={<CircleAlert size={16} />}
                mb="md"
                classNames={{
                  title: classes.alertText,
                  message: classes.alertText,
                  icon: classes.alertText,
                }}
              >
                {error}
              </Alert>
            )}

            <TextInput
              label="Email"
              placeholder="user@gmail.com"
              required
              classNames={{ input: classes.input, label: classes.label }}
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              error={!!error}
            />
            <PasswordInput
              label="Password"
              placeholder="****"
              required
              mt="md"
              classNames={{ input: classes.input, label: classes.label }}
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              error={!!error}
            />

            <Anchor
              component="button"
              type="button"
              c="dimmed"
              size="xs"
              mt="sm"
            >
              Forgot password?
            </Anchor>

            <Button
              fullWidth
              mt="xl"
              type="submit"
              loading={loading}
              className={classes.submitBtn}
            >
              Sign in
            </Button>
          </form>
        </Paper>

        <Text c="dimmed" size="xs" ta="center" mt={20}>
          Don&apos;t have an account?{" "}
          <Anchor href="/register" className={classes.link}>
            Register
          </Anchor>
        </Text>
      </Container>
    </div>
  );
}
