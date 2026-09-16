import { memo, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  COLUMN_STRIDE,
  GAP,
  SLOT_MARGIN,
  SLOT_W,
  TICKET_CLIP_PATH,
  TICKET_H,
  TICKET_OUTLINE_PATH,
  TICKET_STOCK,
  TICKET_W,
  TICKET_WALL_THEMES,
  UNIT,
  decorateTicket,
  withAlpha,
  type TicketWallThemeName,
} from "../lib/ticketWallData";

interface TicketWallBgProps {
  theme?: TicketWallThemeName;
  /** 티켓 열이 기울어지는 각도(도) */
  angle?: number;
  /** 한 바퀴 도는 데 걸리는 시간(초) — 작을수록 빠르게 흐름 */
  speed?: number;
  vignette?: boolean;
  /** 애니메이션 재생 여부. 화면에서 안 보이는 동안(다른 구간을 보고 있을 때)
   * false로 꺼서 불필요한 리페인트를 막음 — 카드 개수가 많아(보통 100장
   * 이상) 계속 돌리면 낭비가 큼. LandingPage.tsx가 스크롤 진행률에 따라
   * 넘겨줌. */
  running?: boolean;
}

// templates/landing-ticket-intro/TicketWallBg.dc.html 포팅. 카드 열을
// "똑같은 카드 묶음 두 벌"로 쌓고 정확히 그 절반만큼 translateY로 이동시켜서
// 이음새 없이 무한 루프처럼 보이게 하는 트릭 — 원본 그대로 유지함(직접
// 재설계하지 않음, 이 프로젝트에서 비슷한 시도가 실패했던 전례가 있어서
// index.css의 stub-boundary류 주석과 같은 이유로 원본 기법을 그대로 포팅).
//
// memo로 감쌈: 이 컴포넌트를 쓰는 LandingHero.tsx는 스크롤할 때마다(매
// 프레임) opacity 등의 props가 바뀌어서 다시 렌더링되는데, 그때마다 이
// 카드 100장 이상을 매번 새로 만들면(원래 memo 없이는 그렇게 됨) 스크롤
// 중 메인 스레드가 계속 바쁜 상태가 됨 — 검색창을 클릭해도 브라우저가 그
// 클릭에 반응(포커스 스타일 페인트)할 틈을 못 찾고 밀리는 원인이었을
// 가능성이 큼. 이 컴포넌트 자신이 실제로 받는 props(theme/angle/speed/
// vignette/running)는 스크롤 중 거의 안 바뀌므로, memo로 그 props가 실제로
// 바뀔 때만 다시 그리게 막음.
export const TicketWallBg = memo(function TicketWallBg({
  theme = "dark",
  angle = -12,
  speed = 48,
  vignette = true,
  running = true,
}: TicketWallBgProps) {
  const [viewport, setViewport] = useState(() => ({
    vw: window.innerWidth,
    vh: window.innerHeight,
  }));
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    function onResize() {
      setViewport({ vw: window.innerWidth, vh: window.innerHeight });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const dark = theme === "dark";
  const palette = TICKET_WALL_THEMES[dark ? "dark" : "light"];

  // 회전된 사각형이 뷰포트를 완전히 덮으려면 축에 맞춘(axis-aligned) 더 큰
  // 상자가 필요함 — 회전 각도만큼 가로/세로로 삐져나오는 여유를 계산.
  const rad = (Math.abs(angle) * Math.PI) / 180;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  const { vw, vh } = viewport;
  const coverY = vw * sin + vh * cos;
  const coverX = vw * cos + vh * sin;

  // 각 열은 ROWS장의 카드로 이루어진 "절반"을 두 벌 이어붙이고, translateY(-50%)로
  // 딱 그 절반만큼만 움직이는 방식으로 루프함 — 그래서 한 절반의 높이가
  // coverY 이상이기만 하면 이음새가 안 보임.
  const rows = Math.ceil(coverY / UNIT) + SLOT_MARGIN;
  const cols = Math.ceil(coverX / SLOT_W) + SLOT_MARGIN;

  const columns = Array.from({ length: cols }, (_, c) => {
    const downward = c % 2 === 1;
    const tickets = Array.from({ length: rows }, (_, i) =>
      decorateTicket(
        TICKET_STOCK[(c * COLUMN_STRIDE + i) % TICKET_STOCK.length],
        dark,
      ),
    );
    return {
      key: c,
      // 아래로 도는 열은 translateY(0)에서 끝나므로, 위쪽 가장자리가 항상
      // 덮여있게 절반칸 위에서 시작함 + 옆 열과 엇갈리게 보이도록 함.
      offset: downward ? -UNIT / 2 : 0,
      animationName: downward ? "atw-down" : "atw-up",
      tickets,
    };
  });

  const coverHeight = Math.ceil(coverY);
  const vignetteBg = vignette
    ? // 대각선 끝(코너)까지 기준으로 stop을 잡아야 전체 프레임이 고르게
      // 어두워짐 — 가장자리만 어두워지면 프레임 형태가 도려낸 것처럼 보임.
      // 그냥 transparent를 쓰면 투명한 "검정"을 거쳐 보간되어 중간 톤이
      // 어긋나 보이므로, palette.paper의 알파값 0짜리로 명시함.
      `radial-gradient(ellipse at center, ${withAlpha(palette.paper, 0)} 48%, ${withAlpha(palette.paper, 0.5)} 78%, ${withAlpha(palette.paper, 0.97)} 100%)`
    : "none";

  const animate = !prefersReducedMotion;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        fontFamily: "'Outfit', system-ui, sans-serif",
        background: palette.paper,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: GAP,
          height: coverHeight,
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        }}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            style={{
              position: "relative",
              width: TICKET_W,
              overflow: "hidden",
              flexShrink: 0,
              height: coverHeight,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                display: "flex",
                flexDirection: "column",
                top: col.offset,
                animation: animate
                  ? `${col.animationName} ${speed}s linear infinite`
                  : undefined,
                animationPlayState: running ? "running" : "paused",
              }}
            >
              {/* 이어붙인 두 벌(half) — 내용은 완전히 동일함 */}
              {[0, 1].map((half) => (
                <div
                  key={half}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: GAP,
                    paddingBottom: GAP,
                  }}
                >
                  {col.tickets.map((t, i) => (
                    <TicketWallCard key={i} t={t} ink={palette} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
          background: vignetteBg,
        }}
      />
    </div>
  );
});

function TicketWallCard({
  t,
  ink,
}: {
  t: ReturnType<typeof decorateTicket>;
  ink: { ink: string; ink2: string; ink3: string; ink4: string };
}) {
  return (
    <div
      style={{
        position: "relative",
        width: TICKET_W,
        height: TICKET_H,
        flexShrink: 0,
        filter: "drop-shadow(0 1px 2px rgba(35,33,28,0.07))",
      }}
    >
      {/* 노치(화살표 모양 절취선) 모양대로 잘라낸 카드 배경 — 아래 SVG가 같은
          모양의 테두리를 그 위에 겹쳐 그림(clip-path는 border를 같이
          잘라버려서 테두리는 별도 stroke로만 안전하게 그려짐, index.css의
          .stub-boundary류와 같은 이유). */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          clipPath: TICKET_CLIP_PATH,
          background: t.bg,
        }}
      >
        {/* 절취선: 두 꼭짓점(위/아래 화살표) 사이, x=84 중심으로 세로로 지남 */}
        <div
          style={{
            position: "absolute",
            left: 83.5,
            top: 7.5,
            bottom: 7.5,
            width: 1,
            backgroundImage: t.perfLine,
          }}
        />
        <div
          style={{
            width: 84,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 8px",
            gap: 6,
          }}
        >
          <span
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: t.accent,
            }}
          >
            {t.category}
          </span>
          <div
            style={{
              width: 28,
              height: 1,
              margin: "4px 0",
              background: t.rule,
            }}
          />
          <span
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontSize: 8,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: t.accentSoft,
            }}
          >
            {t.tag}
          </span>
        </div>
        <div
          style={{
            flex: 1,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 18,
                  fontWeight: 600,
                  color: ink.ink,
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                }}
              >
                {t.event}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: ink.ink3,
                  letterSpacing: "0.12em",
                  marginTop: 4,
                  textTransform: "uppercase",
                }}
              >
                {t.venue}
              </div>
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                marginLeft: 12,
                color: t.accent,
              }}
            >
              {t.price}
            </div>
          </div>
          <div style={{ height: 1, background: t.hairline }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div style={{ display: "flex", gap: 20 }}>
              {t.fields.map((f) => (
                <div key={f.label}>
                  <div
                    style={{
                      fontSize: 8,
                      color: ink.ink4,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      marginBottom: 2,
                    }}
                  >
                    {f.label}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: ink.ink2,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                position: "absolute",
                right: 18,
                top: "50%",
                transform: "translateY(-50%)",
                width: 22,
                height: 60,
                opacity: 0.7,
                backgroundRepeat: "repeat-y",
                backgroundImage: t.barcodeImage,
                backgroundSize: `100% ${t.barcodeTile}`,
              }}
            />
          </div>
        </div>
      </div>
      <svg
        width={TICKET_W}
        height={TICKET_H}
        viewBox={`0 0 ${TICKET_W} ${TICKET_H}`}
        fill="none"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <path
          d={TICKET_OUTLINE_PATH}
          stroke={t.edge}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
