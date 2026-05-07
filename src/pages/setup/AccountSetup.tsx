import React, { useState } from 'react';
import api from '../../api/client';

const Logo = () => (
  <svg width="160" height="32" viewBox="0 0 180 40" fill="none">
    <rect x="0" y="6" width="4" height="22" rx="2" fill="#00C97A"/>
    <rect x="6" y="3" width="4" height="28" rx="2" fill="#00C97A" opacity=".7"/>
    <rect x="12" y="0" width="4" height="34" rx="2" fill="#00C97A" opacity=".9"/>
    <rect x="18" y="5" width="4" height="24" rx="2" fill="#F0A500"/>
    <rect x="24" y="10" width="4" height="16" rx="2" fill="#00C97A" opacity=".6"/>
    <rect x="30" y="2" width="4" height="30" rx="2" fill="#00C97A"/>
    <text x="40" y="28" fontFamily="Georgia,serif" fontSize="20" fontWeight="700" fill="#E8ECF4">Trade</text>
    <text x="90" y="28" fontFamily="Georgia,serif" fontSize="20" fontWeight="400" fill="#00C97A">Pattrnly</text>
  </svg>
);

function TypeCard({ icon, title, desc, selected, onClick }: any) {
  return (
    <div onClick={onClick} style={{
      background: selected ? "rgba(0,201,122,0.05)" : "#0c0f1a",
      border: `2px solid ${selected ? "#00C97A" : "#1a1f30"}`,
      borderRadius: 12, padding: "28px 24px", cursor: "pointer",
      transition: "all .2s", flex: 1,
    }}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#E8ECF4",
        fontFamily: "Georgia,serif", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 12, color: "#556080", lineHeight: 1.7 }}>{desc}</div>
    </div>
  );
}

function Field({ label, value, onChange, type="number", hint, prefix }: any) {
  return (
    <div>
      <label style={{ fontSize: 10, color: "#556080", textTransform: "uppercase" as const,
        letterSpacing: ".08em", display: "block", marginBottom: 6 }}>{label}</label>
      {hint && <div style={{ fontSize: 11, color: "#3a4560", marginBottom: 6 }}>{hint}</div>}
      <div style={{ display: "flex" }}>
        {prefix && (
          <span style={{ padding: "10px 12px", background: "#111626",
            border: "1px solid #1a1f30", borderRight: "none",
            borderRadius: "6px 0 0 6px", fontSize: 12, color: "#556080" }}>{prefix}</span>
        )}
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, padding: "10px 14px", background: "#0c0f1a",
            border: "1px solid #1a1f30",
            borderRadius: prefix ? "0 6px 6px 0" : 6,
            color: "#E8ECF4", fontSize: 13, fontFamily: "inherit", outline: "none" }}/>
      </div>
    </div>
  );
}

export default function AccountSetup({ accountId, onComplete }: { accountId: string; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState<"personal"|"prop"|null>(null);
  const [saving, setSaving] = useState(false);
  const [dailyTarget, setDailyTarget] = useState("");
  const [dailyLossCap, setDailyLossCap] = useState("");
  const [riskPerTrade, setRiskPerTrade] = useState("1");
  const [maxLossTrade, setMaxLossTrade] = useState("");
  const [dailyMaxLoss, setDailyMaxLoss] = useState("");
  const [fiveDayMaxLoss, setFiveDayMaxLoss] = useState("");
  const [profitCap, setProfitCap] = useState("");
  const [challengeTarget, setChallengeTarget] = useState("");
  const [firmName, setFirmName] = useState("");

  const save = async () => {
    setSaving(true);
    try {
      const config = accountType === "personal"
        ? { account_type: "personal", daily_target: parseFloat(dailyTarget)||0,
            daily_loss_cap: parseFloat(dailyLossCap)||0, risk_per_trade: parseFloat(riskPerTrade)||1 }
        : { account_type: "prop", firm_name: firmName,
            max_loss_trade: parseFloat(maxLossTrade)||0, daily_max_loss: parseFloat(dailyMaxLoss)||0,
            five_day_max_loss: parseFloat(fiveDayMaxLoss)||0, profit_cap: parseFloat(profitCap)||0,
            challenge_target: parseFloat(challengeTarget)||0 };
      await api.put("/api/v1/config", config);
      onComplete();
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const btn = (onClick: ()=>void, label: string, disabled=false, ghost=false) => (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, padding: "13px", background: ghost ? "transparent" : disabled ? "#1a1f30" : "#00C97A",
      border: ghost ? "1px solid #252d42" : "none", borderRadius: 8,
      color: ghost ? "#556080" : disabled ? "#556080" : "#000",
      fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#070b14",
      fontFamily: "'JetBrains Mono', monospace",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ marginBottom: 48 }}><Logo /></div>
      <div style={{ width: "100%", maxWidth: 600 }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 40 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: i === step ? 32 : 8, height: 8, borderRadius: 4,
              background: i <= step ? "#00C97A" : "#1a1f30", transition: "all .3s" }}/>
          ))}
        </div>

        {step === 0 && (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: "Georgia,serif",
              color: "#E8ECF4", marginBottom: 8, textAlign: "center" }}>
              What type of account is this?
            </h2>
            <p style={{ color: "#556080", fontSize: 13, textAlign: "center", marginBottom: 32 }}>
              This helps us set up the right risk rules and alerts.
            </p>
            <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
              <TypeCard icon="💼" title="Personal Account"
                desc="Your own funded account. Set daily profit targets and loss caps."
                selected={accountType === "personal"} onClick={() => setAccountType("personal")} />
              <TypeCard icon="🏦" title="Prop Firm Account"
                desc="FTMO, 5ers, MyFundedFX or similar. Track your challenge rules automatically."
                selected={accountType === "prop"} onClick={() => setAccountType("prop")} />
            </div>
            <div style={{ display: "flex" }}>
              {btn(() => accountType && setStep(1), "Continue →", !accountType)}
            </div>
          </div>
        )}

        {step === 1 && accountType === "personal" && (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: "Georgia,serif",
              color: "#E8ECF4", marginBottom: 8, textAlign: "center" }}>Set your daily limits</h2>
            <p style={{ color: "#556080", fontSize: 13, textAlign: "center", marginBottom: 32 }}>
              We will alert you when approaching these limits.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
              <Field label="Daily Profit Target" value={dailyTarget} onChange={setDailyTarget}
                hint="Stop trading when you hit this. Lock in the gains." prefix="$" />
              <Field label="Daily Loss Cap" value={dailyLossCap} onChange={setDailyLossCap}
                hint="Maximum you are willing to lose in a day." prefix="$" />
              <Field label="Risk Per Trade" value={riskPerTrade} onChange={setRiskPerTrade}
                hint="Percentage of account to risk per trade." prefix="%" />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {btn(() => setStep(0), "← Back", false, true)}
              {btn(() => setStep(2), "Continue →")}
            </div>
          </div>
        )}

        {step === 1 && accountType === "prop" && (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: "Georgia,serif",
              color: "#E8ECF4", marginBottom: 8, textAlign: "center" }}>Prop firm rules</h2>
            <p style={{ color: "#556080", fontSize: 13, textAlign: "center", marginBottom: 32 }}>
              Enter your challenge rules and we will track them automatically.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
              <Field label="Firm Name" value={firmName} onChange={setFirmName} type="text"
                hint="e.g. FTMO, 5ers, MyFundedFX" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Max Loss Per Trade" value={maxLossTrade} onChange={setMaxLossTrade} prefix="$" />
                <Field label="Daily Max Loss" value={dailyMaxLoss} onChange={setDailyMaxLoss} prefix="$" />
                <Field label="5-Day Max Loss" value={fiveDayMaxLoss} onChange={setFiveDayMaxLoss} prefix="$" />
                <Field label="Profit Cap" value={profitCap} onChange={setProfitCap} prefix="$" />
              </div>
              <Field label="Challenge Profit Target" value={challengeTarget} onChange={setChallengeTarget}
                hint="The profit target to pass the challenge." prefix="$" />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {btn(() => setStep(0), "← Back", false, true)}
              {btn(() => setStep(2), "Continue →")}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>🚀</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: "Georgia,serif",
              color: "#E8ECF4", marginBottom: 12 }}>You are all set!</h2>
            <p style={{ color: "#556080", fontSize: 13, lineHeight: 1.8, marginBottom: 32 }}>
              Your account is configured. Check your email for the EA download
              and install instructions.
            </p>
            <div style={{ background: "#0c0f1a", border: "1px solid #1a1f30",
              borderRadius: 8, padding: "20px 24px", marginBottom: 32, textAlign: "left" }}>
              {["Account type configured","Risk limits set",
                "Install EA in MetaTrader 5","Set your API key in EA settings",
                "Attach EA to a chart"].map((item, i) => (
                <div key={i} style={{ fontSize: 13,
                  color: i < 2 ? "#00C97A" : "#556080", marginBottom: 8 }}>
                  {i < 2 ? "✓" : "○"} {item}
                </div>
              ))}
            </div>
            <button onClick={save} disabled={saving} style={{
              width: "100%", padding: 14, background: "#00C97A", border: "none",
              borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 700,
              cursor: "pointer", letterSpacing: ".06em" }}>
              {saving ? "Setting up..." : "Go to Dashboard →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
