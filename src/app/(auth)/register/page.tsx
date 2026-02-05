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
  Checkbox,
} from "@mantine/core";
import { CircleAlert } from "lucide-react";
import { setCredentials } from "@/src/lib/features/auth/authSlice";
import { registerAPI } from "@/src/lib/api/mockAuth";
import classes from "./page.module.css";
import { GoogleIcon } from "@/src/app/shared/components/Icons/GoogleIcon";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!terms) {
      setError("You must agree to the Terms and Conditions");
      return;
    }

    setLoading(true);

    try {
      const user = await registerAPI(name, email, password);

      document.cookie =
        "access_token=mock_jwt_token; path=/; max-age=86400; SameSite=Lax";

      dispatch(setCredentials({ user }));
      router.push("/Home");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed");
      }
      setLoading(false);
    }
  };

  return (
    <div className={classes.wrapper}>
      <Container size={440} my={40}>
        <Title ta="center" className={classes.title}>
          Join ClientPulse
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          Start your growth journey today
        </Text>

        <Paper
          withBorder
          shadow="md"
          p={30}
          mt={30}
          radius="md"
          className={classes.paper}
        >
          <form onSubmit={handleRegister}>
            {error && (
              <Alert
                variant="light"
                color="red"
                icon={<CircleAlert size={16} />}
                mb="md"
              >
                {error}
              </Alert>
            )}

            <TextInput
              label="Full Name"
              placeholder="John Doe"
              required
              classNames={{ input: classes.input, label: classes.label }}
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
            />

            <TextInput
              label="Email"
              placeholder="you@clientpulse.com"
              required
              mt="md"
              classNames={{ input: classes.input, label: classes.label }}
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />

            <PasswordInput
              label="Password"
              placeholder="Create a password"
              required
              mt="md"
              classNames={{ input: classes.input, label: classes.label }}
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              required
              mt="md"
              classNames={{ input: classes.input, label: classes.label }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.currentTarget.value)}
              error={
                password !== confirmPassword && confirmPassword.length > 0
                  ? "Passwords do not match"
                  : null
              }
            />

            <Checkbox
              label="I agree to the Terms and Conditions"
              mt="xl"
              checked={terms}
              onChange={(e) => setTerms(e.currentTarget.checked)}
              classNames={{ label: classes.label }}
            />

            <Button
              fullWidth
              mt="xl"
              type="submit"
              loading={loading}
              className={classes.submitBtn}
            >
              Create account
            </Button>
          </form>

          <Button
            fullWidth
            variant="default"
            mt="md"
            leftSection={<GoogleIcon />}
            onClick={() => {}}
          >
            Sign up with Google
          </Button>
        </Paper>

        <Text c="dimmed" size="xs" ta="center" mt={20}>
          Already have an account?{" "}
          <Anchor href="/login" className={classes.link}>
            Login
          </Anchor>
        </Text>
      </Container>
    </div>
  );
}
