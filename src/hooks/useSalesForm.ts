import { useState } from 'react';

export function useSalesForm() {
  const [amounts, setAmounts] = useState(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: '' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [validAmounts, setValidAmounts] = useState<number[]>([]);

  const handleAddAmount = () => {
    if (amounts.length < 10) {
      setAmounts([...amounts, '']);
    }
  };

  const handleRemoveAmount = (index: number) => {
    setAmounts(amounts.filter((_, i) => i !== index));
  };

  const handleAmountChange = (index: number, value: string) => {
    const numValue = parseFloat(value);
    if (value && (isNaN(numValue) || numValue < 0 || numValue > 1000000)) {
      return;
    }
    
    setAmounts(amounts.map((amount, i) => i === index ? value : amount));
  };

  return {
    amounts,
    isSubmitting,
    submitStatus,
    showConfirmDialog,
    showResultDialog,
    validAmounts,
    setIsSubmitting,
    setSubmitStatus,
    setShowConfirmDialog,
    setShowResultDialog,
    setValidAmounts,
    handleAddAmount,
    handleRemoveAmount,
    handleAmountChange,
  };
} 