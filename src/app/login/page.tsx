'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import ukFlag from '../../../UKFlag.png';
import myanmarFlag from '../../../MyanmarFlag.png';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; geminiKey?: string }>(
    {}
  );

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.success) {
          router.push('/dashboard');
        }
      } catch {
        // Not logged in, stay on login page
      }
    };
    checkSession();
  }, [router]);

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  // Validation
  const validate = () => {
    const newErrors: { email?: string; password?: string; geminiKey?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!geminiKey) {
      newErrors.geminiKey = 'Gemini API Key is required for AI features';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, geminiKey }),
      });

      const data = await response.json();

      if (data.success) {
        // Handle remember email
        if (rememberEmail) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }

        toast.success('Welcome back!');
        // Use window.location for full page reload to refresh auth context
        window.location.href = '/dashboard';
      } else {
        toast.error('Login failed', { description: data.error });
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-violet-50 via-purple-50 to-indigo-50 relative">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 sm:h-10 w-24 sm:w-28 justify-between gap-2 rounded-2xl border-slate-200/70 bg-white/90 px-3 shadow-md hover:bg-white hover:shadow-lg transition-all"
            >
              <span className="flex items-center gap-2">
                <Image
                  src={language === 'en' ? ukFlag : myanmarFlag}
                  alt={language === 'en' ? 'English' : 'Myanmar'}
                  width={24}
                  height={16}
                  className="h-4 w-6 rounded-sm border border-slate-200/80 object-cover"
                />
                <span
                  className={cn('font-bold text-slate-700', language === 'mm' && 'font-pyidaungsu')}
                >
                  {language === 'en' ? 'EN' : 'MM'}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-28 rounded-2xl border-slate-200 p-1 shadow-2xl"
          >
            <DropdownMenuItem
              onClick={() => setLanguage('en')}
              className="flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer hover:bg-violet-50"
            >
              <Image
                src={ukFlag}
                alt="English"
                width={24}
                height={16}
                className={cn(
                  'h-4 w-6 rounded-sm border border-slate-200/80 object-cover',
                  language === 'en' && 'ring-2 ring-violet-500'
                )}
              />
              <span className="font-bold text-slate-700">EN</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLanguage('mm')}
              className="flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer hover:bg-violet-50"
            >
              <Image
                src={myanmarFlag}
                alt="Myanmar"
                width={24}
                height={16}
                className={cn(
                  'h-4 w-6 rounded-sm border border-slate-200/80 object-cover',
                  language === 'mm' && 'ring-2 ring-violet-500'
                )}
              />
              <span
                className={cn('font-bold text-slate-700', language === 'mm' && 'font-pyidaungsu')}
              >
                MM
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-white/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-xl shadow-violet-500/20">
              <LayoutDashboard className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-black bg-linear-to-br from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Genius Board
            </CardTitle>
            <CardDescription className="font-medium">{t('auth.login.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-slate-700">
                  {t('auth.login.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    className={`pl-10 h-11 rounded-xl border-slate-200 focus:ring-violet-500 ${errors.email ? 'border-red-500' : ''}`}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-bold text-slate-700">
                  {t('auth.login.password')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    className={`pl-10 pr-10 h-11 rounded-xl border-slate-200 focus:ring-violet-500 ${errors.password ? 'border-red-500' : ''}`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="geminiKey" className="font-bold text-slate-700">
                  {t('auth.login.geminiKey')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input
                    id="geminiKey"
                    name="geminiKey"
                    type="password"
                    placeholder={t('auth.login.geminiKeyPlaceholder')}
                    value={geminiKey}
                    onChange={e => {
                      setGeminiKey(e.target.value);
                      if (errors.geminiKey) setErrors({ ...errors, geminiKey: undefined });
                    }}
                    className={`pl-10 h-11 rounded-xl border-slate-200 focus:ring-violet-500 ${errors.geminiKey ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.geminiKey && (
                  <p className="text-xs text-red-500 font-medium">{errors.geminiKey}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberEmail}
                  onCheckedChange={checked => setRememberEmail(checked === true)}
                  className="rounded-md border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-medium text-slate-600 cursor-pointer"
                >
                  {t('auth.login.rememberMe')}
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-bold text-base rounded-xl bg-linear-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    {t('auth.login.loading')}
                  </>
                ) : (
                  t('auth.login.submit')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="py-6">
        <p className="text-sm text-violet-600/60 text-center">
          © {new Date().getFullYear()} Genius Board. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
