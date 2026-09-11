"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

type Offer = {
  username: string;
  amount: number;
  asset: string;
  status: string;
  offerId: string;
  endsAt: number;
};

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

  requestWriteAccess?: (
    callback: (granted: boolean) => void
  ) => void;

  setHeaderColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

/*
 * IMPORTANT:
 * Do not use Date.now() here.
 *
 * This object is rendered on the server first.
 * Date.now() would produce a different value on the browser,
 * causing a React hydration mismatch.
 */
const DEFAULT_OFFER: Offer = {
  username: "aerivue",
  amount: 150,
  asset: "NFT",
  status: "Claimed",
  offerId: "0aff351c6ed7e322",
  endsAt: 0,
};

function formatDate(timestamp: number) {
  if (!timestamp) {
    return "10 Sep 2026 at 5:25 PM";
  }

  return new Date(timestamp).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTimeLeft(endsAt: number) {
  if (!endsAt) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const difference = Math.max(0, endsAt - Date.now());

  const totalSeconds = Math.floor(difference / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
  };
}

function pad(number: number) {
  return String(number).padStart(2, "0");
}

export default function Home() {
  const [offer, setOffer] = useState<Offer>(DEFAULT_OFFER);

  /*
   * Start with deterministic values.
   * This prevents server/client hydration mismatch.
   */
  const [time, setTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [mounted, setMounted] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);
  const [writeAccessRequested, setWriteAccessRequested] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState("");
  const [startParam, setStartParam] = useState("");

  /*
   * Runs ONLY in the browser after React has mounted.
   *
   * This is where we create the countdown timestamp.
   */
  useEffect(() => {
    setMounted(true);

    const newEndsAt =
      Date.now() +
      37 * 60 * 1000 +
      39 * 1000;

    setOffer((current) => ({
      ...current,
      endsAt: newEndsAt,
    }));

    setTime(getTimeLeft(newEndsAt));

    const tg = window.Telegram?.WebApp;

    if (!tg) {
      setIsTelegram(false);
      return;
    }

    setIsTelegram(Boolean(tg.initData));

    try {
      tg.ready?.();
      tg.expand?.();

      tg.setHeaderColor?.("#ffffff");
      tg.setBottomBarColor?.("#ffffff");
    } catch (error) {
      console.warn(
        "Telegram WebApp initialization failed:",
        error
      );
    }

    const user = tg.initDataUnsafe?.user;

    if (user?.username) {
      setTelegramUsername(user.username);
    }

    const param = tg.initDataUnsafe?.start_param;

    if (param) {
      setStartParam(param);
      console.log("Telegram start_param:", param);
    }
  }, []);

  /*
   * Countdown.
   *
   * It does nothing until the client has mounted
   * and endsAt has been created.
   */
  useEffect(() => {
    if (!mounted || !offer.endsAt) {
      return;
    }

    const updateCountdown = () => {
      setTime(getTimeLeft(offer.endsAt));
    };

    updateCountdown();

    const interval = window.setInterval(
      updateCountdown,
      1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [mounted, offer.endsAt]);

  /*
   * Readable date.
   *
   * Only calculate it after mount so browser/server output
   * cannot cause hydration mismatch.
   */
  const offerDate = useMemo(() => {
    if (!mounted) {
      return "10 Sep 2026 at 5:25 PM";
    }

    return formatDate(offer.endsAt);
  }, [mounted, offer.endsAt]);

  /*
   * FIXED requestWriteAccess handler.
   *
   * It first checks whether we are actually inside
   * Telegram and whether the API exists.
   */
  const handleRequestWriteAccess = () => {
    const tg = window.Telegram?.WebApp;

    /*
     * Normal Chrome / localhost
     */
    if (!tg || !tg.initData) {
      alert(
        "Please open this page from your Telegram bot to enable message access."
      );
      return;
    }

    /*
     * Telegram version/API does not support this method.
     */
    if (
      typeof tg.requestWriteAccess !== "function"
    ) {
      alert(
        "Write access is not available in this Telegram version."
      );
      return;
    }

    try {
      tg.requestWriteAccess((granted) => {
        setWriteAccessRequested(granted);

        if (granted) {
          alert("Write access granted.");
        } else {
          alert("Write access was not granted.");
        }
      });
    } catch (error) {
      console.warn(
        "Telegram requestWriteAccess failed:",
        error
      );

      alert(
        "Telegram could not request message access. Please try opening the Mini App directly inside Telegram."
      );
    }
  };

  return (
    <>
      {/* Telegram WebApp script */}
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
      />

      <main className="page">
        <div className="container">
          {/* Header */}
          <header className="header">
            <div className="brand">
              <div className="brand-icon">
                A
              </div>

              <div>
                <div className="brand-title">
                  Offer Auction
                </div>

                <div className="brand-subtitle">
                  {offer.username}.t.me
                </div>
              </div>
            </div>

            <div className="claimed">
              <span className="claimed-dot" />
              {offer.status}
            </div>
          </header>

          {/* Offer card */}
          <section className="offer-card">
            <div className="offer-top">
              <div>
                <div className="small-label">
                  OFFER
                </div>

                <div className="amount">
                  {offer.amount} TON
                </div>
              </div>

              <div className="asset">
                {offer.asset}
              </div>
            </div>

            <div className="divider" />

            <div className="info-row">
              <span>Telegram Username</span>
              <strong>
                @{offer.username}
              </strong>
            </div>

            <div className="info-row">
              <span>Web Address</span>
              <strong>
                {offer.username}.t.me
              </strong>
            </div>

            <div className="info-row">
              <span>TON Web 3.0 Address</span>
              <strong className="address">
                EQC...{offer.offerId.slice(-8)}
              </strong>
            </div>

            <div className="info-row">
              <span>Offer ID</span>
              <strong className="address">
                {offer.offerId}
              </strong>
            </div>

            <div className="info-row">
              <span>Created</span>
              <strong>{offerDate}</strong>
            </div>
          </section>

          {/* Countdown */}
          <section className="countdown-section">
            <div className="section-title">
              Offer expires in
            </div>

            <div className="countdown">
              <div className="time-box">
                <strong>{pad(time.days)}</strong>
                <span>Days</span>
              </div>

              <div className="time-separator">
                :
              </div>

              <div className="time-box">
                <strong>{pad(time.hours)}</strong>
                <span>Hours</span>
              </div>

              <div className="time-separator">
                :
              </div>

              <div className="time-box">
                <strong>{pad(time.minutes)}</strong>
                <span>Minutes</span>
              </div>

              <div className="time-separator">
                :
              </div>

              <div className="time-box">
                <strong>{pad(time.seconds)}</strong>
                <span>Seconds</span>
              </div>
            </div>
          </section>

          {/* Accept button */}
          <button
            className="accept-button"
            onClick={() => {
              alert(
                "Accept offer flow can be connected to your backend here."
              );
            }}
          >
            Accept the offer
          </button>

          {/* Telegram write access */}
          <section className="write-access">
            <div className="write-access-title">
              Telegram notifications
            </div>

            <div className="write-access-text">
              Allow the bot to send you messages about this
              offer.
            </div>

            <button
              className="secondary-button"
              onClick={handleRequestWriteAccess}
              disabled={writeAccessRequested}
            >
              {writeAccessRequested
                ? "Message access granted"
                : "Allow messages from bot"}
            </button>

            {!isTelegram && (
              <div className="browser-note">
                Open this Mini App inside Telegram to use
                Telegram permissions.
              </div>
            )}
          </section>

          {/* Latest offers */}
          <section className="latest">
            <div className="latest-header">
              <h2>Latest Offers</h2>

              <span>
                Live
              </span>
            </div>

            <div className="latest-list">
              <div className="latest-item">
                <div className="latest-avatar">
                  A
                </div>

                <div className="latest-user">
                  <strong>
                    @{offer.username}
                  </strong>

                  <span>
                    {offer.asset}
                  </span>
                </div>

                <div className="latest-amount">
                  <strong>
                    {offer.amount} TON
                  </strong>

                  <span>
                    {offerDate}
                  </span>
                </div>
              </div>

              <div className="latest-item">
                <div className="latest-avatar">
                  N
                </div>

                <div className="latest-user">
                  <strong>
                    @newoffer
                  </strong>

                  <span>
                    NFT
                  </span>
                </div>

                <div className="latest-amount">
                  <strong>
                    125 TON
                  </strong>

                  <span>
                    Just now
                  </span>
                </div>
              </div>

              <div className="latest-item">
                <div className="latest-avatar">
                  T
                </div>

                <div className="latest-user">
                  <strong>
                    @telegram_user
                  </strong>

                  <span>
                    Username
                  </span>
                </div>

                <div className="latest-amount">
                  <strong>
                    100 TON
                  </strong>

                  <span>
                    2 min ago
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Debug information */}
          {mounted && (
            <div className="debug">
              <div>
                Telegram:{" "}
                {isTelegram ? "Connected" : "Browser"}
              </div>

              {telegramUsername && (
                <div>
                  User: @{telegramUsername}
                </div>
              )}

              {startParam && (
                <div>
                  start_param: {startParam}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}