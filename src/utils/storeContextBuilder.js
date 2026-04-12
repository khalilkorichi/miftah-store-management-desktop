export function buildAgencyContext({ products, coupons, bundles, marketingData, exchangeRate, finalPrices, pricingData }) {
  const lines = [];
  lines.push('═══ ملخص بيانات المتجر ═══\n');

  if (products && products.length > 0) {
    lines.push(`▸ المنتجات (${products.length} منتج):`);
    products.slice(0, 20).forEach(p => {
      const plans = (p.plans || []).map(pl => {
        const official = pl.officialPriceUsd ? `${pl.officialPriceUsd} USD` : '';
        return official;
      }).filter(Boolean).join('، ');
      const desc = p.description ? p.description.substring(0, 100) : '';
      lines.push(`  • ${p.name}${plans ? ` — ${plans}` : ''}${desc ? ` | ${desc}` : ''}`);

      if (finalPrices && finalPrices[p.id]) {
        const fp = Object.values(finalPrices[p.id])[0];
        if (fp) lines.push(`    السعر النهائي: ${fp} ر.س`);
      }

      if (p.competitors && p.competitors.length > 0) {
        p.competitors.forEach(c => {
          lines.push(`    منافس: ${c.name}${c.price ? ` — ${c.price}` : ''}`);
        });
      }
    });
    lines.push('');
  }

  if (coupons && coupons.length > 0) {
    lines.push(`▸ الكوبونات النشطة (${coupons.length}):`);
    coupons.forEach(c => {
      lines.push(`  • ${c.code}: ${c.type === 'percentage' ? c.value + '%' : c.value + ' ر.س'} خصم`);
    });
    lines.push('');
  }

  if (bundles && bundles.length > 0) {
    lines.push(`▸ الحزم (${bundles.length}):`);
    bundles.forEach(b => {
      lines.push(`  • ${b.name}: ${(b.items || []).length} منتج`);
    });
    lines.push('');
  }

  if (marketingData) {
    const personas = marketingData.targetAudience?.personas || [];
    if (personas.length > 0) {
      lines.push(`▸ شخصيات المشتري (${personas.length}):`);
      personas.forEach(p => {
        lines.push(`  • ${p.name} (${p.age} سنة، ${p.job || 'غير محدد'})`);
        if (p.motivations) lines.push(`    الدوافع: ${p.motivations}`);
        if (p.challenges) lines.push(`    التحديات: ${p.challenges}`);
      });
      lines.push('');
    }

    const segments = marketingData.targetAudience?.segments || [];
    if (segments.length > 0) {
      lines.push(`▸ الفئات المستهدفة (${segments.length}):`);
      segments.forEach(s => {
        lines.push(`  • ${s.name}: ${s.description || ''}`);
      });
      lines.push('');
    }

    const allComps = [...(marketingData.competitors?.direct || []), ...(marketingData.competitors?.indirect || [])];
    if (allComps.length > 0) {
      lines.push(`▸ المنافسون التسويقيون (${allComps.length}):`);
      allComps.forEach(c => {
        lines.push(`  • ${c.name}${c.strategies ? ` — ${c.strategies}` : ''}`);
      });
      lines.push('');
    }
  }

  if (exchangeRate) {
    lines.push(`▸ سعر الصرف: 1 USD = ${exchangeRate} SAR`);
  }

  return lines.join('\n');
}
