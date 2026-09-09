'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Search } from 'lucide-react';
import { useLanguage } from './provider';
import { brochure } from '@/lib/brochure';
import configurations from '@/lib/brochure-models.json';

const PAGE_SIZE = 12;
export function EngineCatalog() {
  const { lang } = useLanguage();
  const [brand, setBrand] = useState('Cummins');
  const [frequency, setFrequency] = useState(50);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const t = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const needle = query.trim().toLowerCase();
  const results = configurations.filter(
    (row) =>
      (!brand || row.brand === brand) &&
      row.frequency_hz === frequency &&
      (!needle ||
        `${row.model} ${row.engine_model} ${row.prime_kw}`
          .toLowerCase()
          .includes(needle)),
  );
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const shown = results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <section className="engine-catalog wrap" id="engine-series">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">POWER CONFIGURATIONS</p>
          <h2>
            {t('从发动机开始，', 'Start with the engine.')}
            <br />
            {t('找到匹配的配置。', 'Find your configuration.')}
          </h2>
        </div>
        <p>
          {t(
            '七个发动机品牌，50 Hz 与 60 Hz 配置。按型号、功率和使用条件，进一步沟通整机方案。',
            'Seven engine brands, with 50 Hz and 60 Hz configurations. Explore models and ratings, then discuss the complete set for your application.',
          )}
        </p>
      </div>
      <fieldset
        className="engine-brands"
        aria-label={t('发动机品牌', 'Engine brand')}
      >
        <button
          aria-pressed={!brand}
          onClick={() => {
            setBrand('');
            setPage(0);
          }}
        >
          {t('全部品牌', 'All brands')}
        </button>
        {brochure.brands.map(([en, zh]) => (
          <button
            key={en}
            aria-pressed={brand === en}
            onClick={() => {
              setBrand(en);
              setPage(0);
            }}
          >
            {lang === 'zh' ? zh : en}
          </button>
        ))}
      </fieldset>
      <div className="engine-toolbar">
        <label className="engine-search">
          <Search size={19} />
          <span className="sr-only">
            {t('搜索型号或功率', 'Search model or power')}
          </span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={t(
              '搜索机组、发动机型号或 kW',
              'Search generator, engine or kW',
            )}
          />
        </label>
        <fieldset
          className="engine-frequency"
          aria-label={t('频率', 'Frequency')}
        >
          {[50, 60].map((hz) => (
            <button
              key={hz}
              aria-pressed={frequency === hz}
              onClick={() => {
                setFrequency(hz);
                setPage(0);
              }}
            >
              {hz} Hz
            </button>
          ))}
        </fieldset>
        <span className="engine-count" aria-live="polite">
          {results.length} {t('组配置', 'configurations')}
        </span>
      </div>
      <section
        className="engine-table-scroll"
        aria-label={t(
          '参数表，可横向滚动',
          'Specifications, scroll horizontally',
        )}
      >
        <table className="engine-table">
          <caption className="sr-only">
            {t(
              '福瑞斯画册机组配置参数',
              'Generator configurations from the FRS brochure',
            )}
          </caption>
          <thead>
            <tr>
              <th>{t('机组型号', 'Genset')}</th>
              <th>
                {t('常用功率', 'Prime')}
                <small>kW / kVA</small>
              </th>
              <th>
                {t('备用功率', 'Standby')}
                <small>kW / kVA</small>
              </th>
              <th>{t('发动机', 'Engine')}</th>
              <th>
                {t('排量', 'Displacement')}
                <small>L</small>
              </th>
              <th>{t('尺寸与重量', 'Dimensions & weight')}</th>
              <th>{t('画册页', 'Brochure page')}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr
                key={`${row.brand}:${row.frequency_hz}:${row.model}:${row.engine_model}:${row.prime_kw}`}
              >
                <th scope="row">
                  {row.model}
                  <small>{row.brand}</small>
                </th>
                <td>
                  {row.prime_kw} / {row.prime_kva}
                </td>
                <td>
                  {row.standby_kw} / {row.standby_kva}
                </td>
                <td>{row.engine_model}</td>
                <td>{row.displacement_l}</td>
                <td aria-label={t('尺寸与重量', 'Dimensions and weight')}>
                  <details>
                    <summary
                      aria-label={`${row.model} ${t('尺寸与重量', 'dimensions and weight')}`}
                    >
                      {t('查看', 'View')}
                    </summary>
                    <div className="engine-dimensions">
                      <b>{t('开架', 'Open')}</b>
                      <span>
                        {row.open_dimensions_mm.replaceAll('x', ' × ')} mm
                      </span>
                      <span>{row.open_weight_kg} kg</span>
                      <b>{t('静音 / 集装箱', 'Enclosed / container')}</b>
                      <span>
                        {row.silent_dimensions_mm_or_container.replaceAll(
                          'x',
                          ' × ',
                        )}
                        {row.silent_dimensions_mm_or_container.includes('x')
                          ? ' mm'
                          : ''}
                      </span>
                      <span>{row.silent_weight_kg} kg</span>
                    </div>
                  </details>
                </td>
                <td>{row.printed_page}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {!results.length && (
        <div className="engine-empty">
          <h3>{t('未找到匹配的配置', 'No matching configuration')}</h3>
          <p>
            {t(
              '试试发动机型号、常用功率，或切换品牌与频率。',
              'Try an engine model or prime rating, or change the brand and frequency.',
            )}
          </p>
          <button
            className="power-link"
            onClick={() => {
              setQuery('');
              setBrand('');
              setPage(0);
            }}
          >
            {t('清除搜索与品牌筛选', 'Clear search and brand filter')}
          </button>
        </div>
      )}
      <div className="engine-pagination">
        <p>
          {t(
            '参数摘自公司画册；具体机型、选装与交付配置以确认的技术文件为准。',
            'Specifications from the company brochure. Final model, options and delivery configuration follow the agreed technical documentation.',
          )}
        </p>
        <div>
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            aria-label={t('上一页参数', 'Previous specifications page')}
          >
            <ArrowLeft size={18} />
          </button>
          <span>
            {page + 1} / {pages}
          </span>
          <button
            disabled={page >= pages - 1}
            onClick={() => setPage(page + 1)}
            aria-label={t('下一页参数', 'Next specifications page')}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <a className="text-link" href={`/service?lang=${lang}#inquiry`}>
        {t('沟通您的机组配置', 'Discuss your configuration')}
        <ArrowUpRight size={18} />
      </a>
    </section>
  );
}
