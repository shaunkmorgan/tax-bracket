import React, { useState, useEffect } from 'react';

export default function TaxBracketVisualizer() {
  const [numBrackets, setNumBrackets] = useState(4);
  const [income, setIncome] = useState(90000);
  const [standardDeduction, setStandardDeduction] = useState(14600);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [currentBracket, setCurrentBracket] = useState(-1);
  const [taxPaid, setTaxPaid] = useState(0);
  const [currentIncome, setCurrentIncome] = useState(0);
  
  const [brackets, setBrackets] = useState([
    { min: 0, max: 11925, rate: 10 },
    { min: 11926, max: 48475, rate: 12 },
    { min: 48476, max: 103350, rate: 22 },
    { min: 103351, max: 197300, rate: 24 }
  ]);

  const updateBracket = (index, field, value) => {
    const newBrackets = [...brackets];
    newBrackets[index][field] = field === 'rate' ? parseFloat(value) || 0 : parseInt(value) || 0;
    
    if (field === 'max' && index < brackets.length - 1) {
      newBrackets[index + 1].min = (parseInt(value) || 0) + 1;
    }
    
    setBrackets(newBrackets);
    setHasCalculated(false);
  };

  const addBracket = () => {
    if (brackets.length >= 10) return;
    const lastBracket = brackets[brackets.length - 1];
    setBrackets([...brackets, {
      min: lastBracket.max + 1,
      max: lastBracket.max + 50000,
      rate: 28
    }]);
    setNumBrackets(numBrackets + 1);
    setHasCalculated(false);
  };

  const removeBracket = () => {
    if (brackets.length > 1) {
      setBrackets(brackets.slice(0, -1));
      setNumBrackets(numBrackets - 1);
      setHasCalculated(false);
    }
  };

  const calculateTax = () => {
    const taxableIncome = Math.max(0, income - standardDeduction);
    let totalTax = 0;
    let remainingIncome = taxableIncome;
    const taxPerBracket = [];

    for (let i = 0; i < brackets.length && remainingIncome > 0; i++) {
      const bracket = brackets[i];
      const isLastBracket = i === brackets.length - 1;
      const bracketSize = isLastBracket ? Infinity : bracket.max - bracket.min + 1;
      const incomeInBracket = Math.min(remainingIncome, bracketSize);
      const taxInBracket = incomeInBracket * (bracket.rate / 100);
      
      taxPerBracket.push({
        amount: incomeInBracket,
        tax: taxInBracket,
        rate: bracket.rate
      });
      
      totalTax += taxInBracket;
      remainingIncome -= incomeInBracket;
    }

    return { totalTax, taxPerBracket, taxableIncome };
  };

  const startAnimation = () => {
    setHasCalculated(true);
    setIsAnimating(true);
    setAnimationProgress(0);
    setCurrentBracket(-1);
    setTaxPaid(0);
    setCurrentIncome(0);
  };

  useEffect(() => {
    if (!isAnimating) return;

    const { totalTax, taxPerBracket, taxableIncome } = calculateTax();
    const numActiveBrackets = taxPerBracket.length + 1;
    const duration = numActiveBrackets * 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimationProgress(progress);
      
      const animatedIncome = progress * income;
      const animatedTaxableIncome = Math.max(0, animatedIncome - standardDeduction);
      setCurrentIncome(animatedIncome);
      
      let cumulativeIncome = 0;
      let cumulativeTax = 0;
      let foundBracket = -1;
      
      for (let i = 0; i < taxPerBracket.length; i++) {
        const bracket = brackets[i];
        const isLastBracket = i === brackets.length - 1;
        const bracketSize = isLastBracket ? Infinity : bracket.max - bracket.min + 1;
        const maxIncomeInBracket = Math.min(taxPerBracket[i].amount, bracketSize);
        
        if (animatedTaxableIncome > cumulativeIncome) {
          foundBracket = i;
          const incomeInBracket = Math.min(animatedTaxableIncome - cumulativeIncome, maxIncomeInBracket);
          cumulativeTax += incomeInBracket * (bracket.rate / 100);
          cumulativeIncome += maxIncomeInBracket;
        } else {
          break;
        }
      }
      
      setCurrentBracket(foundBracket);
      setTaxPaid(cumulativeTax);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setCurrentIncome(income);
        setTaxPaid(totalTax);
      }
    };

    animate();
  }, [isAnimating]);

  const getBucketFillLevel = (bucketIndex) => {
    if (!hasCalculated) return 0;
    
    const animatedIncome = isAnimating ? currentIncome : income;
    const animatedTaxableIncome = Math.max(0, animatedIncome - standardDeduction);
    
    if (bucketIndex === -1) {
      const fillAmount = Math.min((animatedIncome / standardDeduction) * 100, 100);
      return fillAmount;
    }
    
    const bracket = brackets[bucketIndex];
    const isLastBracket = bucketIndex === brackets.length - 1;
    
    const bracketSize = isLastBracket ? 1000000 : bracket.max - bracket.min + 1;
    
    let cumulativeIncome = 0;
    for (let i = 0; i < bucketIndex; i++) {
      const b = brackets[i];
      const isLast = i === brackets.length - 1;
      const size = isLast ? 1000000 : b.max - b.min + 1;
      cumulativeIncome += size;
    }
    
    if (animatedTaxableIncome <= cumulativeIncome) return 0;
    
    const incomeInBracket = Math.min(animatedTaxableIncome - cumulativeIncome, bracketSize);
    
    return (incomeInBracket / bracketSize) * 100;
  };

  const { totalTax, taxPerBracket, taxableIncome } = calculateTax();
  const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-indigo-900">Tax Bracket Visualizer</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Income Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Income
                  </label>
                  <input
                    type="text"
                    value={income.toLocaleString()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/,/g, '');
                      if (!isNaN(val)) {
                        setIncome(parseInt(val) || 0);
                        setHasCalculated(false);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Standard Deduction
                  </label>
                  <input
                    type="text"
                    value={standardDeduction.toLocaleString()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/,/g, '');
                      if (!isNaN(val)) {
                        setStandardDeduction(parseInt(val) || 0);
                        setHasCalculated(false);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Tax Brackets</h2>
                <div className="space-x-2">
                  <button
                    onClick={addBracket}
                    disabled={brackets.length >= 10}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 text-sm"
                  >
                    +
                  </button>
                  <button
                    onClick={removeBracket}
                    disabled={brackets.length <= 1}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 text-sm"
                  >
                    -
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {brackets.map((bracket, idx) => {
                  const isLastBracket = idx === brackets.length - 1;
                  return (
                    <div key={idx} className="border border-gray-200 rounded p-3 space-y-2">
                      <div className="font-medium text-sm text-gray-700">Bracket {idx + 1}</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="block text-gray-600">Min $</label>
                          <input
                            type="text"
                            value={bracket.min.toLocaleString()}
                            readOnly
                            className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600">Max $</label>
                          <input
                            type="text"
                            value={isLastBracket ? 'No Max' : bracket.max.toLocaleString()}
                            onChange={(e) => {
                              if (isLastBracket) return;
                              const val = e.target.value.replace(/,/g, '');
                              if (!isNaN(val)) updateBracket(idx, 'max', val);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            disabled={isLastBracket}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600">Rate %</label>
                          <input
                            type="number"
                            value={bracket.rate}
                            onChange={(e) => updateBracket(idx, 'rate', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            step="0.1"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={startAnimation}
              disabled={isAnimating}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            >
              {isAnimating ? 'Animating...' : 'Calculate & Animate'}
            </button>

            {hasCalculated && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Results</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Income:</span>
                    <span className="font-semibold">${(isAnimating ? currentIncome : income).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxable Income:</span>
                    <span className="font-semibold">${Math.max(0, (isAnimating ? currentIncome : income) - standardDeduction).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Tax:</span>
                    <span className="font-semibold text-red-600">${taxPaid.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Effective Rate:</span>
                    <span className="font-semibold">{effectiveRate.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {hasCalculated && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Water Flow Visualization</h2>
                
                <div 
                  className="grid items-end gap-2 justify-items-center"
                  style={{
                    gridTemplateColumns: `repeat(${numBrackets + 1}, minmax(0, 1fr))`,
                    minHeight: '500px',
                  }}
                >
                  <div className="flex flex-col items-center w-full">
                    <div 
                      className="relative w-full border-4 border-gray-400 rounded-lg bg-gray-50 overflow-hidden"
                      style={{ 
                        height: `${Math.max(180, 240 - (numBrackets * 4))}px`,
                        maxWidth: '128px'
                      }}
                    >
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-blue-400 to-blue-300 transition-all duration-100"
                        style={{ height: `${getBucketFillLevel(-1)}%` }}
                      >
                        <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-white to-transparent"></div>
                      </div>
                      {getBucketFillLevel(-1) >= 99 && (
                        <div className="absolute -bottom-1 right-0 w-2 h-8 bg-blue-400" style={{ transform: 'translateX(100%)' }}></div>
                      )}
                    </div>
                    <div className="mt-2 text-center font-medium text-gray-700" style={{ fontSize: `${Math.max(9, 12 - numBrackets * 0.3)}px` }}>
                      Standard<br/>Deduction<br/>${standardDeduction.toLocaleString()}
                    </div>
                  </div>

                  {brackets.slice(0, numBrackets).map((bracket, idx) => {
                    const fillLevel = getBucketFillLevel(idx);
                    const isOverflowing = fillLevel >= 99;
                    const isLastBracket = idx === brackets.length - 1;
                    const bucketHeight = Math.max(180, 240 - (numBrackets * 4));
                    
                    return (
                      <div key={idx} className="flex flex-col items-center w-full">
                        <div 
                          className="relative w-full border-4 border-indigo-400 rounded-lg bg-indigo-50 overflow-hidden"
                          style={{ 
                            height: `${bucketHeight}px`,
                            maxWidth: '128px'
                          }}
                        >
                          <div
                            className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-indigo-400 transition-all duration-100"
                            style={{ height: `${fillLevel}%` }}
                          >
                            <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-white to-transparent"></div>
                          </div>
                          {isOverflowing && idx < numBrackets - 1 && (
                            <div className="absolute -bottom-1 right-0 w-2 h-8 bg-indigo-500" style={{ transform: 'translateX(100%)' }}></div>
                          )}
                        </div>
                        <div className="mt-2 text-center" style={{ fontSize: `${Math.max(9, 12 - numBrackets * 0.3)}px` }}>
                          <div className="font-bold text-indigo-600" style={{ fontSize: `${Math.max(12, 18 - numBrackets * 0.5)}px` }}>{bracket.rate}%</div>
                          <div className="text-gray-600">
                            ${bracket.min.toLocaleString()}-<br/>
                            {isLastBracket ? 'No Max' : `$${bracket.max.toLocaleString()}`}
                          </div>
                          {taxPerBracket[idx] && (
                            <div className="font-semibold text-red-600 mt-1">
                              Tax: ${taxPerBracket[idx].tax.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}