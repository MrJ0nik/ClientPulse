'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Paper, Title, Text, Container, Alert } from '@mantine/core';
import { CircleAlert } from 'lucide-react';
import classes from './page.module.css';
import { GoogleIcon } from '@/src/app/shared/components/Icons/GoogleIcon';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/src/lib/firebase';

export default function RegisterPage() {
  const [error, setError] = useState('');

  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      router.push('/home');
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setError('Something went wrong');
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

          <Button
            fullWidth
            variant="default"
            leftSection={<GoogleIcon />}
            onClick={handleGoogleLogin}
          >
            Sign up with Google
          </Button>
        </Paper>
      </Container>
    </div>
  );
}
