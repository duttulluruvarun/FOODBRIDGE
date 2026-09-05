"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Leaf, Globe2, ShieldCheck, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

export default function LandingPage() {
  const stats = useAppStore((state) => state.stats);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Leaf size={18} />
            </div>
            <span className="font-bold text-xl tracking-tight">FoodBridge OS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#mission" className="hover:text-foreground transition-colors">Mission</Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
            <Link href="#impact" className="hover:text-foreground transition-colors">Impact</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/tax-report">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Tax Calculator</Button>
            </Link>
            <Link href="/auth">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="max-w-5xl mx-auto text-center mt-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
              Every Meal Matters.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto font-light">
              Intelligent Food Redistribution Powered by Real-Time Matching.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth?role=donor">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-emerald-500 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]">
                  Start Donating <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              <Link href="/auth?role=ngo">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-border hover:bg-card">
                  Become an NGO
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Are you an Admin?{" "}
              <Link href="/auth?role=admin" className="font-semibold text-primary hover:underline">
                Log in here
              </Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Live Statistics */}
      <section id="impact" className="py-20 border-y border-border/50 bg-card/30 scroll-mt-16 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
              Our Impact
            </span>
            <h2 className="text-3xl font-bold tracking-tight">Real-Time Logistics at Scale</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div {...fadeIn} className="text-center">
              <h3 className="text-4xl font-bold text-primary mb-2">{stats.mealsSaved.toLocaleString()}</h3>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Meals Saved</p>
            </motion.div>
            <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="text-center">
              <h3 className="text-4xl font-bold text-accent mb-2">{stats.foodRescuedKg.toLocaleString()} kg</h3>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Food Rescued</p>
            </motion.div>
            <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="text-center">
              <h3 className="text-4xl font-bold text-warning mb-2">1,204</h3>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">NGOs Connected</p>
            </motion.div>
            <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="text-center">
              <h3 className="text-4xl font-bold text-destructive mb-2">8,492</h3>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Volunteers Active</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="py-32 px-6 scroll-mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
            Our Mission
          </span>
          <Globe2 className="w-16 h-16 mx-auto text-primary mb-6 opacity-80" />
          <h2 className="text-4xl font-bold mb-6 tracking-tight">The problem is not availability.<br/>The problem is coordination.</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Every day restaurants, hotels, and supermarkets dispose of perfectly edible food, while shelters and community kitchens struggle with unpredictable supply. FoodBridge OS solves this through intelligent, real-time dispatching—matching surplus food to the nearest NGO with capacity before it expires.
          </p>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 px-6 bg-card/30 border-t border-border/50 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
              How It Works
            </span>
            <h2 className="text-3xl font-bold tracking-tight">Intelligent Food Routing</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-3">1. AI Matching</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Our AI analyzes distance, NGO capacity, and shelf life to instantly find the perfect match for every donation.</p>
            </div>
            <div className="glass-card p-8 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Clock className="w-12 h-12 text-accent mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-3">2. Real-Time Dispatch</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Volunteers are notified instantly with optimized routes to ensure food is rescued before it expires.</p>
            </div>
            <div className="glass-card p-8 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Users className="w-12 h-12 text-warning mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-3">3. Maximum Impact</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">NGOs receive exactly what they need, while donors get comprehensive tax reports and ESG impact metrics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 text-center text-muted-foreground text-sm">
        <p>© 2026 FoodBridge OS. All rights reserved.</p>
      </footer>
    </div>
  );
}
