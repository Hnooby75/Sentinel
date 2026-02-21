import MarketingNav from '@/components/marketing/MarketingNav'
import MarketingFooter from '@/components/marketing/MarketingFooter'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark" style={{ backgroundColor: '#05070f', color: '#f1f5f9', minHeight: '100vh' }}>
      <MarketingNav />
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </div>
  )
}
