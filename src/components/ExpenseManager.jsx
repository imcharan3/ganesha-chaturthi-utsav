import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  DollarSign, 
  PieChart, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Search, 
  X, 
  Sparkles,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { saveOfflineData, getOfflineData, enqueueOfflineAction } from '../utils/offlineStorage';
import { downloadPdf } from '../utils/fileDownloader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CATEGORIES = [
  'All',
  'Idol & Mandapam',
  'Sound & Lights',
  'Pooja & Prasadam',
  'Annadanam',
  'Procession & Band',
  'Miscellaneous'
];

export const ExpenseManager = ({ donors = [], settings = {}, onRefresh }) => {
  const { isAdmin, adminToken } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Idol & Mandapam',
    price: '',
    advance: '',
    status: 'Pending',
    paidBy: 'కమిటీ నిధి (Committee Purse)',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Fetch Expenses with Offline Cache
  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const cached = getOfflineData('EXPENSES', []);
      if (cached && cached.length > 0) {
        setExpenses(cached);
      }
      const res = await api.getExpenses();
      setExpenses(res.expenses || []);
      setSummary(res.summary || null);
      saveOfflineData('EXPENSES', res.expenses || []);
    } catch (err) {
      console.warn('Running expenses in offline mode:', err);
      const cached = getOfflineData('EXPENSES', []);
      setExpenses(cached);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // Compute Live Verified Donations
  const totalVerifiedDonations = donors
    .filter(d => d.status === 'Verified')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  // Compute Live Expenses Summary
  const totalExpensesCost = expenses.reduce((sum, e) => sum + (Number(e.price) || 0), 0);
  const totalPaidSoFar = expenses.reduce((sum, e) => sum + (Number(e.advance) || 0), 0);
  const totalBalanceToPay = expenses.reduce((sum, e) => sum + (Number(e.balance) || 0), 0);
  
  // Purse Calculations
  const currentCashInHand = totalVerifiedDonations - totalPaidSoFar;
  const netProjectedSurplus = totalVerifiedDonations - totalExpensesCost;

  // Form balance preview
  const formPrice = Number(formData.price) || 0;
  const formAdvance = Number(formData.advance) || 0;
  const formBalance = Math.max(0, formPrice - formAdvance);

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setFormData({
      name: '',
      category: 'Idol & Mandapam',
      price: '',
      advance: '',
      status: 'Pending',
      paidBy: 'కమిటీ నిధి (Committee Purse)',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingExpense(item);
    setFormData({
      name: item.name || '',
      category: item.category || 'General',
      price: item.price || '',
      advance: item.advance || '',
      status: item.status || 'Pending',
      paidBy: item.paidBy || 'కమిటీ నిధి (Committee Purse)',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('దయచేసి ఐటమ్ పేరు నమోదు చేయండి (Please enter Item Name)');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      alert('దయచేసి సరైన మొత్తం ఖర్చు నమోదు చేయండి (Please enter valid Item Price)');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price) || 0,
        advance: Number(formData.advance) || 0,
        paidBy: formData.paidBy.trim() || 'కమిటీ నిధి',
        notes: formData.notes.trim()
      };

      if (!navigator.onLine) {
        if (editingExpense) {
          enqueueOfflineAction('UPDATE_EXPENSE', { id: editingExpense.id, data: payload });
          setExpenses(prev => prev.map(e => e.id === editingExpense.id ? { ...e, ...payload, balance: (payload.price || 0) - (payload.advance || 0) } : e));
          setFeedbackMessage('💾 ఆఫ్‌లైన్‌లో సేవ్ చేయబడింది (Saved offline, will sync when online)');
        } else {
          enqueueOfflineAction('CREATE_EXPENSE', payload);
          const offlineItem = {
            ...payload,
            id: 'offline-exp-' + Date.now(),
            balance: (payload.price || 0) - (payload.advance || 0),
            status: payload.advance >= payload.price ? 'Paid' : (payload.advance > 0 ? 'Partial' : 'Pending'),
            createdAt: new Date().toISOString()
          };
          setExpenses(prev => [offlineItem, ...prev]);
          setFeedbackMessage('💾 ఆఫ్‌లైన్‌లో సేవ్ చేయబడింది (Saved offline, will sync when online)');
        }
      } else {
        try {
          if (editingExpense) {
            await api.updateExpense(editingExpense.id, payload, adminToken);
            setFeedbackMessage('✅ ఐటమ్ వివరాలు నవీకరించబడ్డాయి (Expense item updated!)');
          } else {
            await api.createExpense(payload, adminToken);
            setFeedbackMessage('✅ కొత్త ఖర్చు ఐటమ్ విజయవంతంగా జోడించబడింది (Expense item added!)');
          }
        } catch (apiErr) {
          if (editingExpense) {
            enqueueOfflineAction('UPDATE_EXPENSE', { id: editingExpense.id, data: payload });
          } else {
            enqueueOfflineAction('CREATE_EXPENSE', payload);
          }
          setFeedbackMessage('💾 ఆఫ్‌లైన్‌లో సేవ్ చేయబడింది (Saved offline, will sync when online)');
        }
      }

      setIsModalOpen(false);
      await loadExpenses();
      if (onRefresh) onRefresh();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      alert('Error saving expense: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`మీరు "${name}" ఐటమ్ ను ఖర్చుల జాబితా నుండి తొలగించాలనుకుంటున్నారా?`)) return;
    try {
      await api.deleteExpense(id, adminToken);
      await loadExpenses();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ మీరు మొత్తం ఖర్చుల వివరాలన్నింటినీ తొలగించాలనుకుంటున్నారా? (Are you sure you want to delete ALL expense records? This cannot be undone!)')) return;
    try {
      await api.clearAllExpenses(adminToken);
      setFeedbackMessage('🗑️ అన్ని ఖర్చుల వివరాలు విజయవంతంగా తొలగించబడ్డాయి (All expenses cleared!)');
      await loadExpenses();
      if (onRefresh) onRefresh();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      alert('Failed to clear expenses: ' + err.message);
    }
  };

  // Filtered List
  const filteredExpenses = expenses.filter(item => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.paidBy && item.paidBy.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Export Expenses PDF
  const handleExportPdf = async () => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const utsavTitle = settings?.utsavName || 'విజయ కాలనీ గణేష్ డైరీస్ 2026';

      // Header Banner
      pdf.setFillColor(124, 45, 18);
      pdf.rect(0, 0, 595.28, 80, 'F');

      pdf.setTextColor(254, 240, 138);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(utsavTitle, 297.64, 28, { align: 'center' });

      pdf.setFontSize(10.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text('COMMITTEE EXPENSES, ADVANCES & PURSE STATEMENT • 2026', 297.64, 46, { align: 'center' });

      pdf.setFontSize(8);
      pdf.setTextColor(254, 215, 170);
      pdf.text(`Total Donations: Rs. ${totalVerifiedDonations.toLocaleString('en-IN')}  |  Paid: Rs. ${totalPaidSoFar.toLocaleString('en-IN')}  |  Future Balance: Rs. ${totalBalanceToPay.toLocaleString('en-IN')}`, 297.64, 65, { align: 'center' });

      // Table preparation
      const tableColumns = [
        { header: '#', dataKey: 'sno' },
        { header: 'Item Name & Category', dataKey: 'item' },
        { header: 'Total Price (Rs)', dataKey: 'price' },
        { header: 'Paid / Advance (Rs)', dataKey: 'advance' },
        { header: 'Balance to Pay (Rs)', dataKey: 'balance' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Notes & Vendor', dataKey: 'notes' }
      ];

      const tableRows = expenses.map((e, idx) => ({
        sno: idx + 1,
        item: `${e.name}\n[${e.category || 'General'}]`,
        price: `Rs. ${Number(e.price || 0).toLocaleString('en-IN')}`,
        advance: `Rs. ${Number(e.advance || 0).toLocaleString('en-IN')}`,
        balance: `Rs. ${Number(e.balance || 0).toLocaleString('en-IN')}`,
        status: e.balance === 0 ? 'Fully Paid' : e.advance > 0 ? 'Partial Adv' : 'Pending',
        notes: e.notes || '-'
      }));

      autoTable(pdf, {
        startY: 92,
        columns: tableColumns,
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 4, valign: 'middle' },
        headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          sno: { cellWidth: 20, halign: 'center' },
          item: { cellWidth: 160 },
          price: { cellWidth: 70, halign: 'right', fontStyle: 'bold' },
          advance: { cellWidth: 75, halign: 'right', textColor: [22, 101, 52], fontStyle: 'bold' },
          balance: { cellWidth: 75, halign: 'right', textColor: [185, 28, 28], fontStyle: 'bold' },
          status: { cellWidth: 60, halign: 'center' },
          notes: { cellWidth: 95, fontSize: 7 }
        },
        foot: [
          [
            { content: 'TOTALS (మొత్తం ఖర్చులు):', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [245, 230, 211] } },
            { content: `Rs. ${totalExpensesCost.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fillColor: [245, 230, 211] } },
            { content: `Rs. ${totalPaidSoFar.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [22, 101, 52], fillColor: [245, 230, 211] } },
            { content: `Rs. ${totalBalanceToPay.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28], fillColor: [245, 230, 211] } },
            { content: `${expenses.length} Items`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [245, 230, 211] } }
          ]
        ],
        margin: { top: 92, left: 20, right: 20, bottom: 40 }
      });

      // Bottom Purse Summary Box
      const finalY = pdf.lastAutoTable.finalY + 15;
      if (finalY < pdf.internal.pageSize.height - 90) {
        pdf.setFillColor(254, 243, 199);
        pdf.roundedRect(20, finalY, 555, 65, 8, 8, 'F');
        pdf.setDrawColor(217, 119, 6);
        pdf.roundedRect(20, finalY, 555, 65, 8, 8, 'D');

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(120, 53, 15);
        pdf.text('PURSE & FINANCIAL POSITION SUMMARY (మిగులు నిధి లెక్కలు):', 30, finalY + 18);

        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(40, 40, 40);
        pdf.text(`1. Total Verified Donations Received: Rs. ${totalVerifiedDonations.toLocaleString('en-IN')}`, 30, finalY + 34);
        pdf.text(`2. Total Amount Paid Out for Items: Rs. ${totalPaidSoFar.toLocaleString('en-IN')}`, 30, finalY + 48);

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(22, 101, 52);
        pdf.text(`CURRENT PURSE IN HAND: Rs. ${currentCashInHand.toLocaleString('en-IN')}`, 310, finalY + 34);
        pdf.setTextColor(netProjectedSurplus >= 0 ? 22 : 185, netProjectedSurplus >= 0 ? 101 : 28, 28);
        pdf.text(`NET PROJECTED SURPLUS (అన్ని బాకీల తర్వాత): Rs. ${netProjectedSurplus.toLocaleString('en-IN')}`, 310, finalY + 48);
      }

      const filename = `Committee_Expenses_Purse_Statement_${new Date().toISOString().slice(0, 10)}.pdf`;
      await downloadPdf(pdf, filename);
    } catch (err) {
      alert('Error creating PDF: ' + err.message);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['#', 'Item Name', 'Category', 'Total Price (Rs)', 'Advance Paid (Rs)', 'Balance to Pay (Rs)', 'Status', 'Paid By', 'Notes'];
    const rows = expenses.map((e, idx) => [
      idx + 1,
      `"${(e.name || '').replace(/"/g, '""')}"`,
      `"${e.category || 'General'}"`,
      e.price || 0,
      e.advance || 0,
      e.balance || 0,
      e.status || 'Pending',
      `"${(e.paidBy || '').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      '',
      `"Total Verified Donations",${totalVerifiedDonations}`,
      `"Total Expenses Cost",${totalExpensesCost}`,
      `"Total Paid So Far",${totalPaidSoFar}`,
      `"Total Balance to Pay",${totalBalanceToPay}`,
      `"Remaining Purse in Hand",${currentCashInHand}`,
      `"Net Projected Surplus",${netProjectedSurplus}`
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Committee_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-sm font-semibold shadow-xl animate-bounce flex items-center justify-between">
          <span>{feedbackMessage}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header & Main Control Toolbar */}
      <div className="temple-card p-5 sm:p-6 rounded-3xl border-2 border-amber-500/40 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-950/80 border border-amber-500/30 text-amber-300 mb-2">
            <Wallet className="w-3.5 h-3.5 text-amber-400" />
            <span>Committee Budget & Purse Manager • ఖర్చుల లెక్కలు</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold gold-gradient-text font-devotional">
            ఉత్సవ ఖర్చులు & మిగులు నిధి గణన
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/80 max-w-xl">
            వినాయక చవితి ఉత్సవాల మొత్తం ఖర్చులు, ఇచ్చిన అడ్వాన్సులు, భవిష్యత్ బాకీలు మరియు మిగులు నిధిని పారదర్శకంగా ట్రాక్ చేయండి.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 font-black text-xs sm:text-sm shadow-gold flex items-center justify-center gap-2 active:scale-95 transition-all hover:brightness-110"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Expense (కొత్త ఖర్చు)</span>
            </button>
          )}

          {isAdmin && expenses.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2.5 rounded-2xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              title="Delete all expense records"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Clear All (అన్నీ తొలగించండి)</span>
            </button>
          )}

          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2.5 rounded-2xl bg-[#2a1107] hover:bg-[#3d180a] border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            title="Download PDF Expenses Statement"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>PDF Ledger</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2.5 rounded-2xl bg-[#2a1107] hover:bg-[#3d180a] border border-amber-500/30 text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            title="Export CSV Spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 5-Card Financial Dashboard with Two Highlight Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Total Donations Collected */}
        <div className="temple-card p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#200c06] to-[#140602] space-y-1">
          <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider block">1. Total Donations (విరాళాలు)</span>
          <div className="text-2xl font-black gold-gradient-text font-mono">
            ₹{totalVerifiedDonations.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-amber-400/70 block">
            {donors.filter(d => d.status === 'Verified').length} Verified Donors
          </span>
        </div>

        {/* Card 2: Total Estimated Cost */}
        <div className="temple-card p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#200c06] to-[#140602] space-y-1">
          <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider block">2. Total Estimated Cost (ఖర్చులు)</span>
          <div className="text-2xl font-black text-amber-100 font-mono">
            ₹{totalExpensesCost.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-amber-400/70 block">
            {expenses.length} Itemized Budget Lines
          </span>
        </div>

        {/* Column 1: Total Amount Paid So Far */}
        <div className="temple-card p-4 rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-950/40 to-[#140602] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">3. Paid So Far (చెల్లించినది)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            ₹{totalPaidSoFar.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-400/80 block font-semibold">
            Advances + Full settlements
          </span>
        </div>

        {/* Column 2: Total Balance to Pay in Future */}
        <div className="temple-card p-4 rounded-2xl border-2 border-rose-500/50 bg-gradient-to-b from-rose-950/40 to-[#140602] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-rose-300 font-bold uppercase tracking-wider">4. Future Balance (చెల్లించాల్సిన బాకీ)</span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="text-2xl font-black text-rose-300 font-mono">
            ₹{totalBalanceToPay.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-rose-400/80 block font-semibold">
            Pending balance across items
          </span>
        </div>

        {/* Highlight Card 5: Remaining Purse Amount from Donations */}
        <div className={`temple-card p-4 rounded-2xl border-2 ${
          currentCashInHand >= 0 ? 'border-amber-400 bg-gradient-to-b from-amber-950/50 to-[#180702]' : 'border-red-500 bg-red-950/50'
        } space-y-1`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">5. Purse in Hand (చేతిలో నిల్వ)</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500 text-amber-950">
              {currentCashInHand >= 0 ? 'Surplus 🟢' : 'Deficit 🔴'}
            </span>
          </div>
          <div className="text-2xl font-black text-yellow-300 font-mono">
            ₹{currentCashInHand.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-amber-200/80 block">
            Net Surplus after all debts: <strong className="text-white font-mono">₹{netProjectedSurplus.toLocaleString('en-IN')}</strong>
          </span>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#190703] p-3 rounded-2xl border border-amber-500/20">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-amber-950 shadow-md font-black'
                  : 'bg-black/40 text-amber-200/70 hover:text-amber-100 hover:bg-black/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 placeholder-amber-400/40 text-xs focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Itemized Expenses Table */}
      <div className="temple-card rounded-3xl border border-amber-500/30 overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#2c1208] text-amber-300 font-bold border-b border-amber-500/30">
              <tr>
                <th className="py-3 px-3 sm:px-4">#</th>
                <th className="py-3 px-3 sm:px-4">ఐటమ్ వివరాలు (Item Name)</th>
                <th className="py-3 px-3 sm:px-4 text-right">మొత్తం ఖర్చు (Price)</th>
                <th className="py-3 px-3 sm:px-4 text-right text-emerald-300">చెల్లించిన అడ్వాన్స్ (Paid)</th>
                <th className="py-3 px-3 sm:px-4 text-right text-rose-300">మిగిలిన బాకీ (Balance)</th>
                <th className="py-3 px-3 sm:px-4 text-center">స్థితి (Status)</th>
                <th className="py-3 px-3 sm:px-4">గమనికలు (Notes)</th>
                {isAdmin && <th className="py-3 px-3 sm:px-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-500/10">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-amber-400/60">
                    No expense records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item, index) => {
                  const isFullyPaid = Number(item.balance || 0) === 0;
                  const isPartial = Number(item.advance || 0) > 0 && !isFullyPaid;
                  
                  return (
                    <tr key={item.id} className="hover:bg-amber-950/30 transition-colors">
                      <td className="py-3.5 px-3 sm:px-4 text-amber-400/70 font-mono">{index + 1}</td>
                      <td className="py-3.5 px-3 sm:px-4">
                        <strong className="text-amber-100 font-semibold block">{item.name}</strong>
                        <span className="text-[10px] text-amber-400/60 bg-black/40 px-2 py-0.5 rounded-md border border-amber-500/20 inline-block mt-0.5">
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-right font-mono font-bold text-amber-100">
                        ₹{Number(item.price || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-right font-mono font-bold text-emerald-400">
                        ₹{Number(item.advance || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-right font-mono font-bold text-rose-400">
                        ₹{Number(item.balance || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          isFullyPaid 
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                            : isPartial
                            ? 'bg-yellow-900/60 text-yellow-300 border border-yellow-500/40'
                            : 'bg-rose-900/60 text-rose-300 border border-rose-500/40'
                        }`}>
                          {isFullyPaid ? '✅ Fully Paid' : isPartial ? '🟡 Partial Adv' : '🔴 Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-xs text-amber-200/70 max-w-xs truncate">
                        {item.notes || '-'}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-3 sm:px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-amber-950 transition-all"
                              title="Edit item"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-600 hover:text-white transition-all"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Grand Totals Table Foot */}
            <tfoot className="bg-[#240e06] text-amber-200 font-bold border-t-2 border-amber-500/40 text-xs sm:text-sm">
              <tr>
                <td colSpan={2} className="py-3.5 px-3 sm:px-4 text-right font-extrabold gold-gradient-text uppercase">
                  మొత్తం లెక్కలు (Grand Totals):
                </td>
                <td className="py-3.5 px-3 sm:px-4 text-right font-mono font-black text-amber-100">
                  ₹{totalExpensesCost.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-3 sm:px-4 text-right font-mono font-black text-emerald-400">
                  ₹{totalPaidSoFar.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-3 sm:px-4 text-right font-mono font-black text-rose-400">
                  ₹{totalBalanceToPay.toLocaleString('en-IN')}
                </td>
                <td colSpan={isAdmin ? 3 : 2} className="py-3.5 px-3 sm:px-4 text-center text-xs text-amber-400/80">
                  Purse Balance: <strong className="text-yellow-300 font-mono">₹{currentCashInHand.toLocaleString('en-IN')}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Item Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg bg-gradient-to-b from-[#240e06] via-[#1c0803] to-[#120502] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div>
                <h3 className="font-devotional text-xl font-bold gold-gradient-text">
                  {editingExpense ? 'ఖర్చు వివరాలు మార్చండి (Edit Expense)' : 'కొత్త ఖర్చు నమోదు (Add New Expense Item)'}
                </h3>
                <p className="text-xs text-amber-200/70">
                  Enter item price and advance to automatically calculate remaining balance.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 rounded-full text-amber-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              
              {/* Item Name */}
              <div>
                <label className="block text-amber-300 font-bold mb-1">
                  ఐటమ్ పేరు (Item Name / Service) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. వినాయక విగ్రహం, సౌండ్ సిస్టమ్, అన్నదానం సరుకులు..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-amber-500/40 text-amber-100 placeholder-amber-500/40 focus:outline-none focus:border-amber-400 text-xs sm:text-sm"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-amber-300 font-bold mb-1">
                  వర్గం (Category)
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a0803] border border-amber-500/40 text-amber-100 focus:outline-none focus:border-amber-400 text-xs sm:text-sm"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Price & Advance Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-300 font-bold mb-1">
                    మొత్తం ఖర్చు (Price of Item ₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 15000"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-amber-500/40 text-amber-100 font-mono font-bold focus:outline-none focus:border-amber-400 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-emerald-300 font-bold mb-1">
                    ఇచ్చిన అడ్వాన్స్ (Advance Paid ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={formData.advance}
                    onChange={(e) => setFormData(prev => ({ ...prev, advance: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Live Generated Balance Card */}
              <div className="p-3.5 rounded-2xl bg-black/70 border border-amber-500/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider block">
                    Auto-Generated Balance to Pay (చెల్లించాల్సిన బాకీ):
                  </span>
                  <div className="text-xl font-black text-rose-400 font-mono">
                    ₹{formBalance.toLocaleString('en-IN')}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                  formBalance === 0 && formPrice > 0
                    ? 'bg-emerald-500 text-emerald-950'
                    : formAdvance > 0
                    ? 'bg-yellow-500 text-yellow-950'
                    : 'bg-rose-500 text-rose-950'
                }`}>
                  {formBalance === 0 && formPrice > 0 ? 'Fully Paid ✅' : formAdvance > 0 ? 'Partial Advance 🟡' : 'Pending 🔴'}
                </span>
              </div>

              {/* Paid By / Payer */}
              <div>
                <label className="block text-amber-300 font-bold mb-1">
                  చెల్లించినది (Paid By / Source)
                </label>
                <input
                  type="text"
                  placeholder="e.g. కమిటీ నిధి (Committee Purse) / ప్రెసిడెంట్..."
                  value={formData.paidBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, paidBy: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-amber-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Vendor & Notes */}
              <div>
                <label className="block text-amber-300 font-bold mb-1">
                  గమనికలు / వెండర్ ఫోన్ నంబర్ (Notes / Vendor Contact)
                </label>
                <textarea
                  rows="2"
                  placeholder="వెండర్ పేరు, ఫోన్ నంబర్ లేదా బిల్ వివరాలు..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-amber-100 text-xs focus:outline-none focus:border-amber-400"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-[#34160b] text-amber-200 text-xs font-bold"
                >
                  రద్దు చేయండి (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-black text-xs shadow-gold hover:brightness-110 disabled:opacity-50"
                >
                  {isSubmitting ? 'సేవ్ అవుతోంది...' : editingExpense ? 'నవీకరించండి (Update Item)' : 'ఖర్చును సేవ్ చేయండి (Save Expense)'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
