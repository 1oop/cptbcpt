import { useState, useRef, useCallback } from 'react'

const BASE_URL = import.meta.env.BASE_URL

const CERT_CONFIG = {
  canvasWidth: 3437,
  canvasHeight: 2551,
  // Name sits just above the blank line (line acts as an underline).
  // textBaseline is 'middle', so y is raised by ~half the font size to rest
  // the bottom of the characters on the line.
  namePosition: { x: 1718, y: 1135 - 65, fontSize: 110, fontColor: '#2C2416' },
  templatePath: `${BASE_URL}template1.png`
}

function loadTemplateImage() {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = CERT_CONFIG.templatePath
  })
}

function renderCertificate(canvas, name) {
  const ctx = canvas.getContext('2d')

  canvas.width = CERT_CONFIG.canvasWidth
  canvas.height = CERT_CONFIG.canvasHeight

  return loadTemplateImage().then(templateImg => {
    ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height)

    ctx.font = `bold ${CERT_CONFIG.namePosition.fontSize}px "Noto Serif SC", "SimSun", serif`
    ctx.fillStyle = CERT_CONFIG.namePosition.fontColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(name, CERT_CONFIG.namePosition.x, CERT_CONFIG.namePosition.y)
  })
}

export default function App() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [generatedName, setGeneratedName] = useState('')
  const canvasRef = useRef(null)

  const handleGenerate = useCallback(async () => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return
    }

    setLoading(true)

    try {
      await renderCertificate(canvasRef.current, trimmedName)
      setGeneratedName(trimmedName)
      setShowPreview(true)

      setTimeout(() => {
        document.getElementById('preview-section')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }, 100)
    } catch (error) {
      console.error('Certificate generation failed:', error)
      alert('证书生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [name])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `结营证书_${generatedName}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [generatedName])

  const handleReset = useCallback(() => {
    setShowPreview(false)
    setGeneratedName('')
    setName('')
  }, [])

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleGenerate()
    }
  }, [handleGenerate])

  return (
    <div className="app-container">
      <header className="page-header">
        <div className="brand-mark">
          <span className="brand-rule" />
          <span className="brand-eyebrow">恒洁营销赋能学院</span>
          <span className="brand-rule" />
        </div>
        <h1 className="page-title">结营证书</h1>
        <p className="page-subtitle">输入学员姓名，即刻签发专属结业证书</p>
      </header>

      {!showPreview ? (
        <main className="panel input-panel">
          <div className="input-group">
            <label htmlFor="userName">学员姓名</label>
            <input
              id="userName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入姓名"
              maxLength={20}
              autoComplete="off"
            />
          </div>
          <button
            className="btn-generate"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? '签发中…' : '签发证书'}
          </button>
          <p className="panel-hint">证书为高清 PNG，签发后可下载保存或打印</p>
        </main>
      ) : null}

      <section
        id="preview-section"
        className={`preview-section ${showPreview ? 'active' : ''}`}
      >
        <div className="preview-header">
          <button className="btn-back" onClick={handleReset}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            重新签发
          </button>
          <div className="preview-title-group">
            <span className="preview-cert-label">{generatedName}</span>
            <span className="preview-cert-sub">结营证书</span>
          </div>
          <button className="btn-download" onClick={handleDownload}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            下载证书
          </button>
        </div>
        <div className="certificate-frame">
          <canvas ref={canvasRef} />
        </div>
      </section>

      <div className={`loading-overlay ${loading ? 'active' : ''}`}>
        <div className="loading-spinner">
          <div className="spinner" />
          <p>正在签发证书…</p>
        </div>
      </div>

      <footer className="footer">
        <span className="footer-ornament">✦</span>
        恒洁营销赋能学院 · 2026
        <span className="footer-ornament">✦</span>
      </footer>
    </div>
  )
}
