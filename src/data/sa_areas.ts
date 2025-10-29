export type District = { id: string; name: string };
export type City = { id: string; name: string; districts: District[] };

// قائمة مختصرة قابلة للتوسعة لمدن سعودية وأحياء شائعة لكل مدينة
export const SA_CITIES: City[] = [
  {
    id: 'riyadh',
    name: 'الرياض',
    districts: [
      { id: 'al-muruj', name: 'المروج' },
      { id: 'al-narjis', name: 'النرجس' },
      { id: 'al-yasmin', name: 'الياسمين' },
      { id: 'al-olaya', name: 'العليا' },
      { id: 'al-malaz', name: 'الملز' },
    ],
  },
  {
    id: 'jeddah',
    name: 'جدة',
    districts: [
      { id: 'al-rawdah', name: 'الروضة' },
      { id: 'al-zahra', name: 'الزهراء' },
      { id: 'al-salamah', name: 'السلامة' },
      { id: 'al-nahdah', name: 'النهضة' },
      { id: 'al-baghdadiyah', name: 'البغدادية' },
    ],
  },
  {
    id: 'dammam',
    name: 'الدمام',
    districts: [
      { id: 'al-shati', name: 'الشاطئ' },
      { id: 'al-faisaliah', name: 'الفيصلية' },
      { id: 'al-anoud', name: 'العنود' },
    ],
  },
  {
    id: 'makkah',
    name: 'مكة المكرمة',
    districts: [
      { id: 'al-aziziyah', name: 'العزيزية' },
      { id: 'al-awali', name: 'العوالي' },
      { id: 'al-sharaie', name: 'الشرائع' },
    ],
  },
  {
    id: 'madinah',
    name: 'المدينة المنورة',
    districts: [
      { id: 'qaba', name: 'قباء' },
      { id: 'al-khalidiyah', name: 'الخالدية' },
      { id: 'al-aqiq', name: 'العقيق' },
    ],
  },
  {
    id: 'khobar',
    name: 'الخبر',
    districts: [
      { id: 'al-rawabi', name: 'الروابي' },
      { id: 'al-aziziyah-kh', name: 'العزيزية' },
      { id: 'al-yarmouk', name: 'اليرموك' },
    ],
  },
  {
    id: 'qassim',
    name: 'القصيم',
    districts: [
      { id: 'al-naseem', name: 'النسيم' },
      { id: 'al-rayyan', name: 'الريان' },
      { id: 'al-sulaimaniyah', name: 'السليمانية' },
    ],
  },
  {
    id: 'abha',
    name: 'أبها',
    districts: [
      { id: 'al-hilal', name: 'الهلال' },
      { id: 'al-mansak', name: 'المنسك' },
      { id: 'al-nahdah-abha', name: 'النهضة' },
    ],
  },
  {
    id: 'jazan',
    name: 'جازان',
    districts: [
      { id: 'samtah', name: 'صامطة' },
      { id: 'abu-araq', name: 'أبو عريش' },
      { id: 'sabya', name: 'صبيا' },
    ],
  },
];

