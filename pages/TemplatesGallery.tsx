
import React, { useEffect, useState } from 'react';
import { Language, CardData, CustomTemplate, TemplateCategory } from '../types';
import { TRANSLATIONS, SAMPLE_DATA } from '../constants';
import { getAllTemplates, getAllCategories } from '../services/firebase';
import CardPreview from '../components/CardPreview';
import { Layout, Palette, Loader2, Sparkles, Plus, Star, FolderOpen, ChevronRight, Hash } from 'lucide-react';

interface TemplatesGalleryProps {
  lang: Language;
  onSelect: (templateId: string) => void;
}

const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({ lang, onSelect }) => {
  const isRtl = lang === 'ar';
  const t = (key: string) => TRANSLATIONS[key][lang] || TRANSLATIONS[key]['en'];
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const sampleCardData = (SAMPLE_DATA[lang] || SAMPLE_DATA['en']) as CardData;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tData, cData] = await Promise.all([
          getAllTemplates(),
          getAllCategories()
        ]);
        setCustomTemplates(tData as CustomTemplate[]);
        setCategories(cData as TemplateCategory[]);
      } catch (err) {
        console.error("Error fetching gallery data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeTemplates = customTemplates.filter(t => t.isActive);
  
  // تصفية القوالب بناءً على القسم المختار
  const filteredTemplates = activeCategoryId === 'all' 
    ? activeTemplates 
    : activeTemplates.filter(tmpl => tmpl.categoryId === activeCategoryId);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{isRtl ? 'جاري تحميل التصاميم...' : 'Loading Designs...'}</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-fade-in-up space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/10 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/20">
          <Palette size={12} />
          {t('templates')}
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
          {isRtl ? 'اختر القسم المناسب لهويتك' : 'Select the Right Section'}
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
          {t('templatesDesc')}
        </p>
      </div>

      {/* شريط الأقسام (Tabs) */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-x-auto no-scrollbar max-w-full">
          <button 
            onClick={() => setActiveCategoryId('all')}
            className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategoryId === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            {isRtl ? 'الكل' : 'All'}
          </button>
          {categories.filter(c => c.isActive).map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategoryId === cat.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
            >
              {isRtl ? cat.nameAr : cat.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* عرض القوالب */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredTemplates.map(tmpl => (
          <TemplateCard key={tmpl.id} tmpl={tmpl} lang={lang} onSelect={onSelect} sampleData={sampleCardData} />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-32 bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
           <FolderOpen className="mx-auto text-gray-200 dark:text-gray-800 mb-6" size={64} />
           <h3 className="text-xl font-black dark:text-white mb-2">{isRtl ? 'لا توجد قوالب في هذا القسم' : 'No templates in this section'}</h3>
           <button onClick={() => setActiveCategoryId('all')} className="text-blue-600 font-bold text-xs uppercase underline">{isRtl ? 'عرض كافة القوالب' : 'Show all templates'}</button>
        </div>
      )}
    </div>
  );
};

const TemplateCard = ({ tmpl, lang, onSelect, sampleData }: any) => {
  const isRtl = lang === 'ar';
  const t = (key: string) => TRANSLATIONS[key][lang] || TRANSLATIONS[key]['en'];

  return (
    <div className="group flex flex-col transition-all duration-500">
      <div className={`relative aspect-[9/16] w-full bg-gray-50 dark:bg-[#0f0f12] rounded-[3rem] border-2 shadow-sm overflow-hidden mb-6 group-hover:shadow-[0_40px_100px_-20px_rgba(59,130,246,0.3)] group-hover:-translate-y-2 transition-all duration-500 ${tmpl.isFeatured ? 'border-amber-400/50' : 'border-gray-100 dark:border-gray-800'}`}>
        {tmpl.isFeatured && (
          <div className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-full font-black text-[9px] uppercase shadow-lg shadow-amber-500/20">
            <Star size={12} fill="currentColor" />
            {isRtl ? 'مميز' : 'Featured'}
          </div>
        )}
        <div className="absolute inset-0 p-4 flex items-center justify-center overflow-hidden">
           <div className="w-full h-full scale-[0.85] origin-top pointer-events-none">
              <CardPreview 
                data={{ 
                  ...sampleData, 
                  templateId: tmpl.id,
                  themeType: tmpl.config.defaultThemeType || sampleData.themeType,
                  themeColor: tmpl.config.defaultThemeColor || sampleData.themeColor,
                  themeGradient: tmpl.config.defaultThemeGradient || sampleData.themeGradient,
                  backgroundImage: tmpl.config.defaultBackgroundImage || sampleData.backgroundImage,
                  profileImage: tmpl.config.defaultProfileImage || sampleData.profileImage || '',
                  isDark: tmpl.config.defaultIsDark ?? sampleData.isDark,
                  nameColor: tmpl.config.nameColor,
                  titleColor: tmpl.config.titleColor,
                  bioTextColor: tmpl.config.bioTextColor,
                  bioBgColor: tmpl.config.bioBgColor,
                  linksColor: tmpl.config.linksColor,
                  showName: tmpl.config.showNameByDefault ?? true,
                  showTitle: tmpl.config.showTitleByDefault ?? true,
                  showCompany: tmpl.config.showCompanyByDefault ?? true,
                  showBio: tmpl.config.showBioByDefault ?? true,
                  showEmail: tmpl.config.showEmailByDefault ?? true,
                  showWebsite: tmpl.config.showWebsiteByDefault ?? true,
                  showSocialLinks: tmpl.config.showSocialLinksByDefault ?? true,
                  showButtons: tmpl.config.showButtonsByDefault ?? true,
                  showQrCode: tmpl.config.showQrCodeByDefault ?? true,
                  showOccasion: tmpl.config.showOccasionByDefault ?? false,
                  occasionTitleAr: tmpl.config.occasionTitleAr,
                  occasionTitleEn: tmpl.config.occasionTitleEn,
                  occasionDate: tmpl.config.occasionDate,
                  occasionMapUrl: tmpl.config.occasionMapUrl,
                  occasionPrimaryColor: tmpl.config.occasionPrimaryColor,
                  occasionBgColor: tmpl.config.occasionBgColor,
                  occasionTitleColor: tmpl.config.occasionTitleColor,
                  occasionOffsetY: tmpl.config.occasionOffsetY,
                  occasionFloating: tmpl.config.occasionFloating
                }} 
                lang={lang} 
                customConfig={tmpl.config}
                hideSaveButton={true} 
              />
           </div>
        </div>
        <div className="absolute inset-0 bg-blue-600/5 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center z-[60]">
           <button 
             onClick={() => onSelect(tmpl.id)}
             className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase shadow-2xl flex items-center gap-3 transform translate-y-6 group-hover:translate-y-0 transition-all duration-500 hover:scale-105 active:scale-95"
           >
             {t('useTemplate')}
             <Plus size={18} />
           </button>
        </div>
      </div>
      <div className="px-6 text-center sm:text-start flex flex-col gap-1">
         <div className="flex items-center justify-center sm:justify-start gap-3">
            <span className={`w-2 h-2 rounded-full ${tmpl.isFeatured ? 'bg-amber-500' : 'bg-blue-600'}`}></span>
            <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">
              {isRtl ? tmpl.nameAr : tmpl.nameEn}
            </h3>
         </div>
         <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 leading-relaxed uppercase tracking-widest">
           {isRtl ? tmpl.descAr : tmpl.descEn}
         </p>
      </div>
    </div>
  );
};

export default TemplatesGallery;
