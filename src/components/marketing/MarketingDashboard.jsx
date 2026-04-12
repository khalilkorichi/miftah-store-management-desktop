import { useMemo } from 'react';
import { TargetIcon, SwordsIcon, CompassIcon, PenToolIcon, UsersIcon, UserIcon, AgencyIcon } from '../Icons';
import { AGENT_META } from '../../data/contentAgencyData';

export default function MarketingDashboard({ marketingData, products, suppliers, onNavigate, agencyData }) {
  const { targetAudience, competitors, swot, contentStyles } = marketingData;

  const totalCompetitors = competitors.direct.length + competitors.indirect.length;
  const totalSegments = targetAudience.segments.length;
  const totalPersonas = targetAudience.personas.length;
  const totalContentFiles = contentStyles.length;

  const agencyPipeline = agencyData?.pipeline || [];
  const agencyReady = agencyPipeline.filter(i => i.stage === 'done' && (i.status === 'approved' || i.status === 'approved_with_issues')).length;
  const agencyPending = agencyPipeline.filter(i => i.stage === 'approval' && i.status === 'pending').length;
  const agencyTotal = agencyPipeline.length;

  const latestCompPrice = useMemo(() => {
    let latest = null;
    (products || []).forEach(prod => {
      (prod.competitors || []).forEach(comp => {
        if (comp.price != null) latest = { name: comp.name, price: comp.price };
      });
    });
    return latest;
  }, [products]);

  const cards = [
    {
      id: 'swot',
      tab: 'swot',
      title: 'تحليل SWOT',
      icon: CompassIcon,
      size: 'large',
      color: '#5E4FDE',
      content: (
        <div className="bento-swot-grid">
          <div className="bento-swot-q bento-swot-s">
            <span className="bento-swot-label">نقاط القوة</span>
            <span className="bento-swot-count">{swot.strengths.length}</span>
          </div>
          <div className="bento-swot-q bento-swot-w">
            <span className="bento-swot-label">نقاط الضعف</span>
            <span className="bento-swot-count">{swot.weaknesses.length}</span>
          </div>
          <div className="bento-swot-q bento-swot-o">
            <span className="bento-swot-label">الفرص</span>
            <span className="bento-swot-count">{swot.opportunities.length}</span>
          </div>
          <div className="bento-swot-q bento-swot-t">
            <span className="bento-swot-label">التهديدات</span>
            <span className="bento-swot-count">{swot.threats.length}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'competitors',
      tab: 'competitors',
      title: 'المنافسون',
      icon: SwordsIcon,
      size: 'medium',
      color: '#F97316',
      value: totalCompetitors,
      sub: latestCompPrice
        ? `${competitors.direct.length} مباشر · ${competitors.indirect.length} غير مباشر — آخر سعر: ${latestCompPrice.price} (${latestCompPrice.name})`
        : `${competitors.direct.length} مباشر · ${competitors.indirect.length} غير مباشر`,
    },
    {
      id: 'personas',
      tab: 'audience',
      title: 'شخصيات المشتري',
      icon: UserIcon,
      size: 'medium',
      color: '#3B82F6',
      value: totalPersonas,
      sub: totalPersonas > 0 ? `آخر إنشاء: ${targetAudience.personas[targetAudience.personas.length - 1]?.name}` : 'لم يتم إنشاء أي شخصية بعد',
    },
    {
      id: 'content',
      tab: 'content-style',
      title: 'ملفات تحليل المحتوى',
      icon: PenToolIcon,
      size: 'small',
      color: '#EC4899',
      value: totalContentFiles,
      sub: 'ملف تحليل',
    },
    {
      id: 'segments',
      tab: 'audience',
      title: 'الفئات المستهدفة',
      icon: UsersIcon,
      size: 'small',
      color: '#10B981',
      value: totalSegments,
      sub: 'فئة مستهدفة',
    },
    {
      id: 'agency',
      tab: 'agency',
      title: 'وكالة المحتوى',
      icon: AgencyIcon,
      size: 'medium',
      color: '#8B5CF6',
      content: (
        <div className="bento-agency-content">
          <div className="bento-agency-agents">
            {['scott', 'spark', 'brill', 'rami', 'lens'].map(id => (
              <span key={id} className="bento-agency-agent" title={AGENT_META[id].role}>
                {AGENT_META[id].icon}
              </span>
            ))}
          </div>
          <div className="bento-agency-stats">
            <div className="bento-agency-stat">
              <span className="bento-agency-stat-val">{agencyReady}</span>
              <span className="bento-agency-stat-lbl">جاهز</span>
            </div>
            <div className="bento-agency-stat">
              <span className="bento-agency-stat-val">{agencyPending}</span>
              <span className="bento-agency-stat-lbl">بانتظار</span>
            </div>
            <div className="bento-agency-stat">
              <span className="bento-agency-stat-val">{agencyTotal}</span>
              <span className="bento-agency-stat-lbl">إجمالي</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="bento-grid">
      {cards.map(card => (
        <button
          key={card.id}
          className={`bento-card bento-${card.size}`}
          onClick={() => onNavigate(card.tab)}
          style={{ '--bento-accent': card.color }}
        >
          <div className="bento-card-header">
            <div className="bento-card-icon" style={{ background: `${card.color}22` }}>
              <card.icon />
            </div>
            <span className="bento-card-title">{card.title}</span>
          </div>
          {card.content ? (
            <div className="bento-card-body">{card.content}</div>
          ) : (
            <div className="bento-card-body">
              <span className="bento-card-value">{card.value}</span>
              <span className="bento-card-sub">{card.sub}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
