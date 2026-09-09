import { copy } from './content';

// Editorial copy verified against the supplied 26-spread company brochure.
// Conflicting dates, scale claims and certification status are not republished.
export const brochure = {
  company: copy(
    '福瑞斯围绕柴油发电机组及相关电力系统，提供研发制造、选型配套、安装维护与备件支持。',
    'FRS POWER brings together generator development, manufacturing, configuration, installation, maintenance and spare-parts support.',
  ),
  manufacturing: copy(
    '从钣金加工、焊接、涂装到装配，结合生产进度与质量数据管理，让制造过程可追溯。',
    'Sheet-metal fabrication, welding, finishing and assembly, supported by production and quality records throughout the process.',
  ),
  controls: copy(
    '围绕负载、备用时长与现场条件，配置控制监测、同步并机、燃油储存与水套预热等辅助系统。',
    'Configure monitoring, synchronized operation, fuel storage and water-jacket preheating around loads, standby needs and site conditions.',
  ),
  service: copy(
    '从选型与安装，到日常维护、备件更换和升级大修，为设备持续运行提供支持。',
    'Support throughout selection and installation, routine maintenance, replacement parts, upgrades and overhauls.',
  ),
  container: copy(
    '将发电、冷却、排气与控制系统集成于可运输的箱体，结合现场条件安排设备安装、防护与维护通道。',
    'Generation, cooling, exhaust and control systems integrated in a transportable enclosure, with protection and service access planned for the site.',
  ),
  brands: [
    ['ISUZU', '五十铃'],
    ['Kubota', '久保田'],
    ['Cummins', '康明斯'],
    ['Perkins', '珀金斯'],
    ['Yuchai', '玉柴'],
    ['Weichai', '潍柴'],
    ['SDEC', '上柴'],
  ],
};
