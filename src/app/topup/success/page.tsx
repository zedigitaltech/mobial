import Link from "next/link"
import { CheckCircle, ArrowRight, TrendingUp } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function TopupSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center py-20">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="border-white/5 bg-white/[0.03] backdrop-blur-2xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto h-16 w-16 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                  Top-Up Complete
                </Badge>
                <h1 className="text-3xl font-black tracking-tight">
                  Data Added Successfully
                </h1>
                <p className="text-muted-foreground">
                  Your eSIM has been topped up. The additional data should be available within a few minutes.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  asChild
                  className="rounded-xl h-12 font-black uppercase tracking-widest text-[10px]"
                >
                  <Link href="/check-usage">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Check Updated Usage
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="rounded-xl h-12 font-bold"
                >
                  <Link href="/">
                    Back to Home <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
