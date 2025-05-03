
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ResendVerificationProps {
  email: string;
}

export default function ResendVerification({ email }: ResendVerificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    try {
      if (cooldown > 0) {
        toast.error(`Please wait ${cooldown} seconds before trying again`);
        return;
      }

      setIsLoading(true);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      setCooldown(60); // Set 60 second cooldown
      toast.success('Verification email has been resent. Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground text-center">
          Didn't receive the verification email?
        </p>
        <Button
          onClick={handleResend}
          disabled={isLoading || cooldown > 0}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {isLoading 
            ? 'Sending...' 
            : cooldown > 0 
              ? `Resend available in ${cooldown}s` 
              : 'Resend verification email'
          }
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground text-center">
          Already verified your email?
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLoginClick}
        >
          Back to Login
        </Button>
      </div>
    </div>
  );
}
