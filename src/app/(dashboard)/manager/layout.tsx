import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/shared/dashboard-layout'
import { ThemeProvider } from '@/components/shared/theme-provider'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, entities(*)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'active') redirect('/login')

  const { data: theme } = await supabase
    .from('theme_settings')
    .select('*')
    .maybeSingle()

  return (
    <>
      <ThemeProvider initialTheme={theme} />
      <DashboardLayout basePath="/manager" role="manager" user={profile as any} entity={profile.entities as any}>
        {children}
      </DashboardLayout>
    </>
  )
}
