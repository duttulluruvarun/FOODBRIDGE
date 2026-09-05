"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Download, IndianRupee, Receipt, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

export default function TaxReportPage() {
  const [amount, setAmount] = useState<number>(500000);
  const [taxSlab, setTaxSlab] = useState<number>(0.30); // 30% default slab
  const [refId, setRefId] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => {
      setRefId(`FB-TAX-EST-${Math.floor(1000 + Math.random() * 9000)}`);
      setDateStr(new Date().toLocaleDateString());
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // In India (Section 80G), donations are typically up to 50% tax deductible.
  // We'll mock a 50% deduction of the amount, multiplied by the tax slab.
  const deductibleAmount = amount * 0.50;
  const netSavings = deductibleAmount * taxSlab;

  const handleDownload = () => {
    toast.success("Preparing Official Estimate PDF...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-6">
      
      {/* Interactive UI (Hidden during print) */}
      <div className="max-w-4xl mx-auto print:hidden">
        
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Back to Home
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Tax Deduction Estimator</h1>
          <p className="text-lg text-muted-foreground">Calculate your potential tax savings by donating surplus food to verified NGOs through FoodBridge OS.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Calculator Widget */}
          <Card className="glass-card border-border/50 shadow-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calculator className="text-primary" size={24} /> 
                Donation Value
              </CardTitle>
              <CardDescription>Estimate the fair market value of your food donations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Estimated Value (Annual)</label>
                  <span className="text-xl font-bold text-primary">₹{amount.toLocaleString('en-IN')}</span>
                </div>
                <input 
                  type="range" 
                  min="50000" 
                  max="5000000" 
                  step="50000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹50K</span>
                  <span>₹50L+</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium">Corporate Tax Slab</label>
                <div className="grid grid-cols-3 gap-3">
                  {[0.15, 0.25, 0.30].map((slab) => (
                    <Button
                      key={slab}
                      variant={taxSlab === slab ? "default" : "outline"}
                      className={taxSlab === slab ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border-border text-muted-foreground hover:text-foreground hover:bg-card"}
                      onClick={() => setTaxSlab(slab)}
                    >
                      {slab * 100}%
                    </Button>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Visualization & Results */}
          <div className="flex flex-col gap-6">
            <motion.div 
              key={amount + taxSlab}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card className="bg-primary/10 border-primary/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <CardContent className="p-8 text-center">
                  <Receipt className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
                  <p className="text-sm font-medium text-primary mb-2 uppercase tracking-widest">Estimated Tax Savings</p>
                  <h2 className="text-5xl font-bold text-white mb-2">
                    ₹{netSavings.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </h2>
                  <p className="text-sm text-muted-foreground">Based on {taxSlab * 100}% corporate tax bracket and 50% allowable deduction limit.</p>
                </CardContent>
              </Card>
            </motion.div>

            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between flex-1">
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2"><IndianRupee size={18} className="text-accent"/> Break Down</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Total Donated Value</span>
                    <span className="font-medium text-white">₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Deductible Amount (50%)</span>
                    <span className="font-medium text-white">₹{deductibleAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleDownload} className="w-full mt-6 bg-white text-black hover:bg-gray-200">
                <Download size={18} className="mr-2" /> Download Official Estimate (PDF)
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Printable PDF Layout (Visible only during print) */}
      <div className="hidden print:block w-full max-w-3xl mx-auto bg-white text-black min-h-screen p-12">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-emerald-800 uppercase mb-2">FoodBridge OS</h1>
            <p className="text-lg text-gray-600 font-medium">Official Tax Estimate Report</p>
          </div>
          <div className="text-right text-gray-500">
            <p>Date: {dateStr}</p>
            <p>Ref: {refId}</p>
          </div>
        </div>

        {/* Introduction */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-3 text-gray-800">Estimate Overview</h2>
          <p className="text-gray-600 leading-relaxed text-justify">
            This document serves as an official estimate of potential corporate tax savings based on the projected value of surplus food donations made through the FoodBridge OS platform. Deductions are calculated assuming a standard Section 80G eligibility (50% deduction on gross donated value).
          </p>
        </div>

        {/* Financial Breakdown Table */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Calculation Breakdown</h2>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 font-semibold text-gray-700 bg-gray-50 w-2/3">Total Estimated Donated Value</td>
                  <td className="py-4 px-6 text-right font-bold text-gray-900">₹{amount.toLocaleString('en-IN')}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 font-semibold text-gray-700 bg-gray-50">Allowable Deduction Rate</td>
                  <td className="py-4 px-6 text-right text-gray-900">50%</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 font-semibold text-gray-700 bg-gray-50">Total Deductible Amount</td>
                  <td className="py-4 px-6 text-right font-bold text-gray-900">₹{deductibleAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 font-semibold text-gray-700 bg-gray-50">Corporate Tax Slab Applied</td>
                  <td className="py-4 px-6 text-right text-gray-900">{taxSlab * 100}%</td>
                </tr>
                <tr className="bg-emerald-50">
                  <td className="py-5 px-6 font-bold text-emerald-900 text-lg">Estimated Net Tax Savings</td>
                  <td className="py-5 px-6 text-right font-extrabold text-emerald-700 text-2xl">
                    ₹{netSavings.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer / Disclaimer */}
        <div className="mt-20 pt-8 border-t border-gray-300 text-sm text-gray-500 text-center">
          <p className="mb-2 font-semibold">Disclaimer & Notice</p>
          <p>
            This estimate is for planning purposes only and does not constitute formal tax advice. Actual tax savings may vary based on final audited donations, specific corporate structures, and prevailing tax laws at the time of filing.
          </p>
          <p className="mt-4 font-bold text-gray-400">Generated securely via FoodBridge OS Ecosystem</p>
        </div>

      </div>

    </div>
  );
}
