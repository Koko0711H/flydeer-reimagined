export type Lang = 'zh' | 'en';
export type Copy = { zh: string; en: string };
export const copy = (zh: string, en: string): Copy => ({ zh, en });
export const contact = {
  phone: '+86 182 0593 8836',
  tel: 'tel:+8618205938836',
  email: 'flydeerpower@googlel.com',
  whatsapp: 'https://wa.me/8618205938836',
  address: copy(
    '福建省福州市仓山智能产业园 C 区 1006',
    'Room 1006, Block C, Cangshan Intelligent Industrial Park, Fuzhou, Fujian',
  ),
  hours: copy(
    '周一至周六 8:30–18:00',
    'Monday–Saturday, 8:30–18:00 (China time)',
  ),
};
export const navigation = [
  { href: '/', label: copy('首页', 'Home') },
  { href: '/products', label: copy('产品中心', 'Products') },
  { href: '/showroom', label: copy('网上展厅', 'Showroom') },
  { href: '/about', label: copy('关于我们', 'About') },
  { href: '/cases', label: copy('项目案例', 'Applications') },
  { href: '/news', label: copy('新闻动态', 'News') },
  { href: '/service', label: copy('销售与服务', 'Service') },
];
export const products = [
  {
    id: 'silent',
    name: copy('静音型发电机组', 'Silent generator sets'),
    line: 'SILENT POWER',
    range: '30–600 kW',
    desc: copy(
      '将可靠动力，融入日常。箱式结构为关注声音与空间的场所提供发电方案。',
      'Dependable power designed to fit everyday spaces. An enclosed configuration for applications where sound and space matter.',
    ),
    uses: copy(
      '酒店 / 医疗 / 住宅备用',
      'Hospitality / Healthcare / Residential backup',
    ),
    features: [
      copy('静音箱式结构', 'Acoustic enclosure'),
      copy('可选 ATS 切换', 'Optional ATS transfer'),
      copy('远程监控选配', 'Optional remote monitoring'),
    ],
  },
  {
    id: 'open-frame',
    name: copy('大功率开架机组', 'Heavy-duty open sets'),
    line: 'INDUSTRIAL POWER',
    range: '100–2000 kW',
    desc: copy(
      '为复杂工况，留出充足空间。开放式结构，便于维护、散热与现场系统集成。',
      'Room for demanding conditions. An open configuration supporting maintenance, cooling and on-site system integration.',
    ),
    uses: copy('工厂 / 矿山 / 工程施工', 'Factories / Mining / Construction'),
    features: [
      copy('开放式维护空间', 'Accessible maintenance'),
      copy('按需并机配置', 'Parallel operation options'),
      copy('面向工程集成', 'Built for integration'),
    ],
  },
  {
    id: 'open-frame-small',
    name: copy('标准开架机组', 'Standard open sets'),
    line: 'ESSENTIAL POWER',
    range: '500 kW · 50 Hz',
    desc: copy(
      '从常规备用到现场作业，以清晰的结构和便捷的维护，构建实用动力方案。',
      'From standby supply to field operations, a practical power platform with an accessible layout.',
    ),
    uses: copy(
      '厂房 / 设备配套 / 现场供电',
      'Workshops / Equipment / Site power',
    ),
    features: [
      copy('标准开架布局', 'Standard open layout'),
      copy('便于维护保养', 'Service-friendly access'),
      copy('配套方案咨询', 'Configuration support'),
    ],
  },
  {
    id: 'mobile',
    name: copy('移动拖车电源', 'Mobile trailer power'),
    line: 'POWER ON THE MOVE',
    range: '30–500 kW',
    desc: copy(
      '动力不必停在原地。面向户外作业与临时用电，把电源送到需要的地方。',
      'Power need not stay in one place. A mobile platform for outdoor work and temporary electricity requirements.',
    ),
    uses: copy(
      '应急 / 户外作业 / 临时用电',
      'Emergency / Field work / Temporary power',
    ),
    features: [
      copy('拖车式移动平台', 'Trailer platform'),
      copy('适应临时部署', 'Temporary deployment'),
      copy('现场需求选配', 'Site-specific options'),
    ],
  },
  {
    id: 'high-voltage',
    name: copy('高压配电系统', 'High-voltage distribution'),
    line: 'CONNECTED POWER',
    range: '10–35 kV',
    desc: copy(
      '让动力有序抵达。从发电到配电，衔接工业现场的系统化用电需求。',
      'Power, delivered with purpose. Connecting generation and distribution for industrial applications.',
    ),
    uses: copy(
      '工业园区 / 矿业 / 商业设施',
      'Industrial parks / Mining / Commercial facilities',
    ),
    features: [
      copy('模块化系统配置', 'Modular configuration'),
      copy('监测与保护配套', 'Monitoring and protection'),
      copy('项目化方案咨询', 'Project engineering support'),
    ],
  },
];
export const cases = [
  {
    id: 'airport-terminal',
    title: copy('航空枢纽', 'Airport terminal'),
    kind: 'AIRPORT TERMINAL',
    category: 'infrastructure',
    desc: copy(
      '面向航站楼与地面设施，围绕关键负载、切换逻辑和设备空间，讨论备用供电配置。',
      'Backup power planning for terminal and ground facilities, considering critical loads, transfer logic and available space.',
    ),
  },
  {
    id: 'telecom-center',
    title: copy('通信中心', 'Telecom center'),
    kind: 'TELECOM CENTER',
    category: 'infrastructure',
    desc: copy(
      '通信设备需要稳定的备用供电。选型从负载组成、启动方式与运行管理要求开始。',
      'Telecom equipment needs dependable backup. Planning starts with load composition, starting requirements and operation management.',
    ),
  },
  {
    id: 'manufacturing-campus',
    title: copy('制造园区', 'Manufacturing campus'),
    kind: 'MANUFACTURING CAMPUS',
    category: 'industry',
    desc: copy(
      '生产、公用设施与办公负载各不相同。结合分区用电与机房条件，梳理配置和配电方式。',
      'Production, utilities and office loads differ. Equipment and distribution planning should reflect each zone and plant-room constraints.',
    ),
  },
  {
    id: 'rail-hub',
    title: copy('交通枢纽', 'Transport hub'),
    kind: 'TRANSPORT HUB',
    category: 'infrastructure',
    desc: copy(
      '人流与运营交织的现场，需要从关键设备到机房布置共同考虑备用电源方案。',
      'Busy transport facilities call for backup planning that considers critical equipment as well as the plant-room layout.',
    ),
  },
  {
    id: 'public-service',
    title: copy('公共建筑', 'Public facilities'),
    kind: 'PUBLIC FACILITIES',
    category: 'public',
    desc: copy(
      '围绕公共服务场所的用电需求，评估关键负载、日常维护与现场安装条件。',
      'Assessing critical loads, routine maintenance and installation requirements for public-service environments.',
    ),
  },
  {
    id: 'mountain-hospitality',
    title: copy('山地旅居', 'Mountain hospitality'),
    kind: 'MOUNTAIN HOSPITALITY',
    category: 'commercial',
    desc: copy(
      '为远离城市电网的旅居环境，综合考虑运输、声音、运行管理与现场供电需求。',
      'For hospitality away from urban grids, power planning considers transport, sound, operation and site requirements.',
    ),
  },
  {
    id: 'industrial-process',
    title: copy('工业现场', 'Industrial processes'),
    kind: 'INDUSTRIAL PROCESSES',
    category: 'industry',
    desc: copy(
      '泵、风机与控制设备有不同的负载特性。以实际工况为基础，沟通适合的动力方案。',
      'Pumps, fans and controls have different load characteristics. Power configuration begins with the actual operating conditions.',
    ),
  },
];
export const process = [
  {
    image: 'factory-fabrication.webp',
    label: copy('制造', 'Fabrication'),
    title: copy(
      '可靠，始于每一道工序。',
      'Reliability starts with the details.',
    ),
    body: copy(
      '从结构加工到部件配合，制造过程构成整机品质的基础。',
      'From structural fabrication to component integration, the manufacturing process forms the foundation of the complete set.',
    ),
  },
  {
    image: 'factory-assembly.webp',
    label: copy('装配', 'Assembly'),
    title: copy(
      '将各个部分，组成一个整体。',
      'Individual parts. One complete system.',
    ),
    body: copy(
      '发动机、发电机、控制与底座协同布局，为运行与维护留出空间。',
      'Engine, alternator, controls and base are arranged together with operation and maintenance in mind.',
    ),
  },
  {
    image: 'factory-testing-center.webp',
    label: copy('验证', 'Verification'),
    title: copy('交付之前，先看运行。', 'Before delivery, see it run.'),
    body: copy(
      '把整机功能与运行检查纳入交付流程，结合项目要求确认设备配置。',
      'Complete-set function and operation checks form part of the delivery process, alongside project configuration checks.',
    ),
  },
  {
    image: 'delivery/delivery-site-05.webp',
    label: copy('交付', 'Delivery'),
    title: copy(
      '从制造现场，抵达用电现场。',
      'From our workshop to your site.',
    ),
    body: copy(
      '围绕运输、卸载、落位与安装条件，沟通具体的现场交付安排。',
      'Delivery planning considers transport, unloading, positioning and installation conditions at the destination.',
    ),
  },
];
