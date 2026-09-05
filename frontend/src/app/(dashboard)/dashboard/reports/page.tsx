"use client";

import { useState, useRef } from "react";
import { Download, FileBarChart, Loader2, Printer, ShieldCheck, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getDonorTaxReportData,
  getDonationComplianceReportData,
  getNgoFulfillmentReportData,
} from "@/app/actions/reports";

function toCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escapeCell = (value: any) => {
    const str = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [taxData, setTaxData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openTaxModal, setOpenTaxModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [isGeneratingCompliance, setIsGeneratingCompliance] = useState(false);
  const [isGeneratingFulfillment, setIsGeneratingFulfillment] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);

  async function handleGenerateTaxReport() {
    setIsLoading(true);
    setOpenTaxModal(true);
    const data = await getDonorTaxReportData();
    setTaxData(data);
    setIsLoading(false);
  }

  async function handleGenerateComplianceReport() {
    setIsGeneratingCompliance(true);
    try {
      const data = await getDonationComplianceReportData();
      if (data.length === 0) {
        toast.error("No donation data found to export");
      } else {
        downloadCsv(`donation-compliance-report-${Date.now()}.csv`, data);
        toast.success("Donation Compliance Report exported");
      }
    } finally {
      setIsGeneratingCompliance(false);
    }
  }

  async function handleGenerateFulfillmentReport() {
    setIsGeneratingFulfillment(true);
    try {
      const data = await getNgoFulfillmentReportData();
      if (data.length === 0) {
        toast.error("No completed matches found to export");
      } else {
        downloadCsv(`ngo-fulfillment-report-${Date.now()}.csv`, data);
        toast.success("NGO Fulfillment Report exported");
      }
    } finally {
      setIsGeneratingFulfillment(false);
    }
  }

  async function handleExportAll() {
    setIsExportingAll(true);
    try {
      const [compliance, fulfillment, tax] = await Promise.all([
        getDonationComplianceReportData(),
        getNgoFulfillmentReportData(),
        getDonorTaxReportData(),
      ]);

      if (compliance.length === 0 && fulfillment.length === 0 && tax.length === 0) {
        toast.error("No data found to export");
        return;
      }

      const stamp = Date.now();
      if (compliance.length > 0) downloadCsv(`donation-compliance-report-${stamp}.csv`, compliance);
      if (fulfillment.length > 0) downloadCsv(`ngo-fulfillment-report-${stamp}.csv`, fulfillment);
      if (tax.length > 0) downloadCsv(`tax-exemption-summary-${stamp}.csv`, tax);
      toast.success("All reports exported");
    } finally {
      setIsExportingAll(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  if (selectedDonor) {
    return (
      <div className="min-h-full print:bg-transparent">
        <div className="print:hidden mb-6 flex justify-between items-center relative">
          <Button onClick={() => setSelectedDonor(null)} variant="outline" className="rounded-xl">
            ← Back
          </Button>
          
          <h2 className="text-2xl font-bold text-slate-900 absolute left-1/2 -translate-x-1/2 hidden md:block">
            Certificate Preview
          </h2>

          <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white">
            <Printer size={16} className="mr-2" /> Download as PDF
          </Button>
        </div>
        
        <div className="max-w-3xl mx-auto bg-white shadow-2xl print:shadow-none print:max-w-none">
          <div className="border-4 border-double border-emerald-800 p-8 h-full print:border-none print:p-0 print:break-inside-avoid">
            <div className="text-center mb-6 relative z-10">
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest mb-1 print:text-2xl print:text-black">FoodBridge Foundation</h1>
              <p className="text-sm font-semibold text-slate-600 print:text-sm print:text-black">Regd. under Section 80G(5)(vi) of the Income Tax Act, 1961</p>
              <div className="h-1 w-24 bg-emerald-600 mx-auto mt-4 print:mt-2 print:w-24 print:bg-black"></div>
            </div>

            <h2 className="text-xl font-bold text-emerald-700 text-center mb-6 font-serif italic print:text-lg print:mb-3 print:text-black">Certificate of Donation</h2>

            <div className="space-y-4 text-slate-800 text-sm leading-relaxed print:text-xs print:leading-snug print:space-y-2 print:text-black">
              <p>
                This is to certify that <strong className="text-slate-900 print:text-black">{selectedDonor.name}</strong> (PAN: <strong className="text-slate-900 print:text-black">{selectedDonor.panNumber}</strong>)
                residing at <em className="text-slate-700 print:text-black">{selectedDonor.address}</em> has generously contributed towards the mission of eradicating hunger.
              </p>
              <p>
                During the current financial year, the donor has successfully facilitated the recovery and redistribution of
                <strong className="text-slate-900 print:text-black"> {selectedDonor.totalWeightKg} kg</strong> of surplus food across <strong className="text-slate-900 print:text-black">{selectedDonor.totalDonations}</strong> successful donation drives.
              </p>
              <p>
                By redirecting this surplus food, the donor has actively prevented the emission of <strong className="text-slate-900 print:text-black">{selectedDonor.totalCo2Saved} kg of CO2</strong> equivalent, contributing significantly to environmental sustainability.
              </p>

              <div className="bg-emerald-50 p-4 my-6 rounded-xl border border-emerald-100 print:p-3 print:my-3 print:bg-transparent print:border-2 print:border-black print:rounded-none">
                <div className="flex justify-between items-center mb-4 print:mb-2">
                  <span className="font-semibold text-slate-700 print:text-black">Estimated Fair Market Value of Food:</span>
                  <span className="text-lg font-bold text-slate-900 print:text-sm print:text-black">₹{selectedDonor.estimatedValueINR.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-emerald-200 print:pt-2 print:border-black">
                  <span className="font-semibold text-emerald-800 print:text-black">Eligible Deduction Amount (50%):</span>
                  <span className="text-xl font-black text-emerald-700 print:text-base print:text-black">₹{selectedDonor.deductibleValueINR.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-between items-end relative z-10 print:mt-6">
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-2 print:w-20 print:h-20 print:mb-2">
                  <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full text-emerald-800 -rotate-12 opacity-80">
                    {/* Outer rings */}
                    <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="6 4" />
                    <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    
                    {/* Circular Text Paths */}
                    <path id="curveTop" d="M 25,100 A 75,75 0 0,1 175,100" fill="none" />
                    <path id="curveBottom" d="M 175,100 A 75,75 0 0,1 25,100" fill="none" />

                    <text fill="currentColor" fontSize="20" fontWeight="bold" letterSpacing="2">
                      <textPath href="#curveTop" startOffset="50%" textAnchor="middle">★ OFFICIAL RECORD ★</textPath>
                    </text>
                    <text fill="currentColor" fontSize="18" fontWeight="bold" letterSpacing="2">
                      <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">80G TAX EXEMPT</textPath>
                    </text>

                    {/* Prominent Center Banner across the seal */}
                    <g transform="rotate(-8 100 100)">
                       <rect x="5" y="78" width="190" height="44" fill="white" stroke="currentColor" strokeWidth="3" />
                       <text x="100" y="108" fill="currentColor" fontSize="26" fontWeight="900" letterSpacing="2" textAnchor="middle">FOODBRIDGE</text>
                    </g>
                  </svg>
                </div>
                <p className="font-bold text-slate-900 border-t-2 border-slate-900 pt-2 w-48 text-center text-xs print:text-[11px] print:w-40 print:pt-1 print:text-black print:border-black">
                  Date of Issue: {new Date().toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-center text-slate-800 mb-1 print:mb-1 print:text-black" style={{fontFamily: 'cursive', fontSize: '1.5rem', lineHeight: '1'}}>
                  Nitin Kannan
                </p>
                <p className="font-bold text-slate-900 border-t-2 border-slate-900 pt-2 w-48 text-center text-xs print:text-[11px] print:w-40 print:pt-1 print:text-black print:border-black">
                  Authorized Signatory
                </p>
              </div>
            </div>

            <p className="text-[10px] italic text-slate-500 text-center mt-6 print:mt-3 print:text-[9px] print:text-gray-600">
              *This receipt is valid for tax deduction under Section 80G of the Indian Income Tax Act.
              Calculations are based on estimated fair market value. Please consult a tax advisor for final filing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:hidden">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Reports</h1>
          <p className="text-slate-500">Export compliance and logistics reports for audit and tax purposes.</p>
        </div>
        
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md"
          onClick={handleExportAll}
          disabled={isExportingAll}
        >
          {isExportingAll ? (
            <Loader2 size={18} className="mr-2 animate-spin" />
          ) : (
            <Download size={18} className="mr-2" />
          )}
          Export All (CSV)
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="rounded-2xl border-slate-200 shadow-sm cursor-pointer hover:border-emerald-500 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <FileBarChart size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">Donation Compliance Report</h3>
              <p className="text-sm text-slate-500 mt-1">Generates a CSV of all food donations with weight, nutritional info, and donor details.</p>
            </div>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={handleGenerateComplianceReport}
              disabled={isGeneratingCompliance}
            >
              {isGeneratingCompliance ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              Generate
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm cursor-pointer hover:border-blue-500 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <FileBarChart size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">NGO Fulfillment Report</h3>
              <p className="text-sm text-slate-500 mt-1">Export completed match metrics and recipient capacity fulfillments.</p>
            </div>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={handleGenerateFulfillmentReport}
              disabled={isGeneratingFulfillment}
            >
              {isGeneratingFulfillment ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              Generate
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm cursor-pointer hover:border-purple-500 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
              <FileBarChart size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">Tax Exemption Summary</h3>
              <p className="text-sm text-slate-500 mt-1">Calculate Section 80G tax deductions for donors based on total food value donated.</p>
            </div>
            <Button 
              variant="outline" 
              className="rounded-xl"
              onClick={handleGenerateTaxReport}
            >
              Generate
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={openTaxModal} onOpenChange={setOpenTaxModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto print:hidden">
          <DialogHeader>
            <DialogTitle>Tax Exemption Summaries (Donors)</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-600" /></div>
            ) : taxData.length === 0 ? (
              <p className="text-center text-slate-500">No donor data found.</p>
            ) : (
              <div className="space-y-4">
                {taxData.map((donor) => (
                  <div key={donor.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900">{donor.name}</h4>
                      <p className="text-xs text-slate-500">Donated {donor.totalWeightKg} kg • Prevented {donor.totalCo2Saved} kg CO2</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Est. Value</p>
                        <p className="font-bold text-emerald-700">₹{donor.estimatedValueINR.toLocaleString('en-IN')}</p>
                      </div>
                      <Button size="sm" className="bg-slate-900 hover:bg-slate-800" onClick={() => setSelectedDonor(donor)}>
                        View Certificate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Removed the separate print-only div and modal to resolve PDF printing blank page issues */}
    </div>
  );
}
