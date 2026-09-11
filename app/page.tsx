"use client";

import { useEffect, useState } from "react";

type TelegramWebApp = {
  version?: string;
  initData?: string;
  initDataUnsafe?: {
    start_param?: string;
    user?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
  ready?: () => void;
  expand?: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

type Offer = {
  username: string;
  amount: number;
  asset: string;
  status: "Claimed" | "Active";
  offerId: string;
  createdAt: string;
};

const DEFAULT_OFFER: Offer = {
  username: "aerivue",
  amount: 150,
  asset: "NFT",
  status: "Claimed",
  offerId: "0aff351c6ed7e322",
  createdAt: "10 Sep 2026 at 5:25 PM",
};

export default function Home() {
  const [offer] = useState<Offer>(DEFAULT_OFFER);

  const [telegramUser, setTelegramUser] = useState("");
  const [startParam, setStartParam] = useState("");
  const [insideTelegram, setInsideTelegram] = useState(false);

  const [time, setTime] = useState({
    hours: 0,
    minutes: 37,
    seconds: 39,
  });

  const [accepted, setAccepted] = useState(false);

  /*
   * Telegram initialization
   */
  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (!tg) {
      return;
    }

    // Do NOT call unsupported Telegram methods here.
    tg.ready?.();
    tg.expand?.();

    setInsideTelegram(Boolean(tg.initData));

    const username = tg.initDataUnsafe?.user?.username;

    if (username) {
      setTelegramUser(username);
    }

    const param = tg.initDataUnsafe?.start_param;

    if (param) {
      setStartParam(param);
      console.log("start_param:", param);
    }
  }, []);

  /*
   * Countdown
   */
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime((current) => {
        if (
          current.hours === 0 &&
          current.minutes === 0 &&
          current.seconds === 0
        ) {
          return current;
        }

        let hours = current.hours;
        let minutes = current.minutes;
        let seconds = current.seconds - 1;

        if (seconds < 0) {
          seconds = 59;
          minutes -= 1;
        }

        if (minutes < 0) {
          minutes = 59;
          hours -= 1;
        }

        if (hours < 0) {
          hours = 0;
          minutes = 0;
          seconds = 0;
        }

        return {
          hours,
          minutes,
          seconds,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const handleAccept = () => {
    if (!insideTelegram) {
      alert("Please open this page inside Telegram.");
      return;
    }

    setAccepted(true);
  };

  return (
    <main className="app">
      <div className="page">
        {/* TOP BAR */}
        <header className="topbar">
          <div className="brand">
            <div className="brand-logo">F</div>

            <div>
              <div className="brand-name">Fragment</div>
              <div className="brand-subtitle">
                Username auction
              </div>
            </div>
          </div>

          <button className="menu-button">•••</button>
        </header>

        {/* MAIN OFFER CARD */}
        <section className="hero-card">
          <div className="status-row">
            <div className="status">
              <span className="status-dot" />
              {offer.status}
            </div>

            <div className="asset-label">
              {offer.asset}
            </div>
          </div>

          <div className="username">
            @{offer.username}
          </div>

          <div className="web-address">
            {offer.username}.t.me
          </div>

          <div className="price">
            <span>{offer.amount}</span>
            <small>TON</small>
          </div>

          <div className="price-label">
            Current offer
          </div>
        </section>

        {/* OFFER INFORMATION */}
        <section className="card">
          <div className="card-title">
            Offer details
          </div>

          <div className="detail-row">
            <span>Telegram Username</span>
            <strong>@{offer.username}</strong>
          </div>

          <div className="detail-row">
            <span>Web Address</span>
            <strong>{offer.username}.t.me</strong>
          </div>

          <div className="detail-row">
            <span>TON Web3 Address</span>
            <strong className="mono">
              EQC...{offer.offerId.slice(-8)}
            </strong>
          </div>

          <div className="detail-row">
            <span>Offer ID</span>
            <strong className="mono">
              {offer.offerId}
            </strong>
          </div>

          <div className="detail-row">
            <span>Created</span>
            <strong>{offer.createdAt}</strong>
          </div>
        </section>

        {/* COUNTDOWN */}
        <section className="countdown-card">
          <div className="countdown-title">
            Offer expires in
          </div>

          <div className="timer">
            <div className="timer-item">
              <div className="timer-number">
                {String(time.hours).padStart(2, "0")}
              </div>
              <div className="timer-label">Hours</div>
            </div>

            <div className="colon">:</div>

            <div className="timer-item">
              <div className="timer-number">
                {String(time.minutes).padStart(2, "0")}
              </div>
              <div className="timer-label">Minutes</div>
            </div>

            <div className="colon">:</div>

            <div className="timer-item">
              <div className="timer-number">
                {String(time.seconds).padStart(2, "0")}
              </div>
              <div className="timer-label">Seconds</div>
            </div>
          </div>
        </section>

        {/* ACCEPT */}
        <section className="action">
          <button
            className="accept-button"
            onClick={handleAccept}
            disabled={accepted}
          >
            {accepted
              ? "Offer accepted"
              : "Accept the offer"}
          </button>

          {!insideTelegram && (
            <div className="telegram-note">
              Open this Mini App from Telegram to
              accept the offer.
            </div>
          )}

          {telegramUser && (
            <div className="telegram-user">
              Connected as @{telegramUser}
            </div>
          )}
        </section>

        {/* LATEST OFFERS */}
        <section className="latest-section">
          <div className="latest-header">
            <div>
              <div className="latest-title">
                Latest Offers
              </div>

              <div className="latest-subtitle">
                Recent activity
              </div>
            </div>

            <div className="live">
              <span />
              Live
            </div>
          </div>

          <div className="offer-list">
            <OfferItem
              username="aerivue"
              amount="150"
              time="Just now"
              active
            />

            <OfferItem
              username="telegram"
              amount="125"
              time="2 min ago"
            />

            <OfferItem
              username="username"
              amount="100"
              time="5 min ago"
            />

            <OfferItem
              username="tonuser"
              amount="85"
              time="8 min ago"
            />
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div>Powered by Telegram Mini Apps</div>

          {startParam && (
            <div className="start-param">
              Offer: {startParam}
            </div>
          )}
        </footer>
      </div>
    </main>
  );
}

function OfferItem({
  username,
  amount,
  time,
  active = false,
}: {
  username: string;
  amount: string;
  time: string;
  active?: boolean;
}) {
  return (
    <div className="offer-item">
      <div className="avatar">
        {username.charAt(0).toUpperCase()}
      </div>

      <div className="offer-user">
        <div className="offer-username">
          @{username}
        </div>

        <div className="offer-time">
          {time}
        </div>
      </div>

      <div className="offer-price">
        <div>
          {amount} <span>TON</span>
        </div>

        {active && (
          <small>Current</small>
        )}
      </div>
    </div>
  );
}