/**
 * The Market Sentinel agent chain, laid out as the lab's pipeline.
 *
 * Order here is the order of the pillars, front to back. `gateAfter` marks
 * where the approval barrier is drawn; `blocked` marks the node that sits
 * behind it and is therefore unreachable until approval is written.
 *
 * The master profile is explicit about what this project is NOT. Forex, OANDA,
 * Alpha Vantage, Self-RAG, Docker, Ragas and LangSmith appear nowhere in the
 * code and must never be claimed here.
 */

const ACCENT = '#b65fff'
const REPOSITORY = 'https://github.com/Thanuish/Market_sentinal'

export default [
    {
        label: 'Watchdog',
        role: 'Market Sentinel  ·  agent 1',
        title: 'Watchdog',
        url: REPOSITORY,
        sections: [
            {
                accent: ACCENT,
                kicker: 'Deterministic screen',
                title: 'No model decides what gets looked at',
                lines: [
                    'Runs a deterministic RSI and MACD technical screen over daily bars.',
                    'Market data via yfinance, US equities.',
                    'Offline first: a synthetic data generator means the whole system runs with no API keys.'
                ],
                chips: [ 'Python', 'RSI', 'MACD', 'yfinance' ]
            }
        ]
    },
    {
        label: 'Evaluator',
        role: 'Market Sentinel  ·  agent 2',
        title: 'Evaluator',
        url: REPOSITORY,
        sections: [
            {
                accent: ACCENT,
                kicker: 'Retrieval-augmented risk gate',
                title: 'The only thing that can write an approval',
                lines: [
                    'RAG retrieval from a local corpus of news and filings notes, with keyword sentiment scoring.',
                    'Decides whether a screened signal is allowed through, and writes that decision into graph state.',
                    'The LLM judgement hook is present but off by default, so by default no model runs in the loop at all.'
                ],
                chips: [ 'LangGraph', 'RAG', 'Risk gate' ]
            }
        ]
    },
    {
        label: 'Approval Gate',
        role: 'Market Sentinel  ·  the point of the project',
        title: 'Approval gate',
        url: REPOSITORY,
        gateAfter: true,
        sections: [
            {
                accent: ACCENT,
                kicker: 'Why the barrier is shut',
                title: 'Gating is code, not a prompt',
                lines: [
                    'The order execution path is structurally unreachable until the Evaluator writes an explicit approval into graph state.',
                    'This is enforced by the state machine, not by instructing a model to behave.',
                    'A prompt can be talked out of a rule. A state machine cannot.',
                    '12 pytest tests cover this: 5 on gate enforcement, 7 on sizing, including a proof that the executor refuses unapproved signals.'
                ],
                chips: [ 'State machine gating', 'pytest', 'Hallucination containment' ]
            }
        ]
    },
    {
        label: 'Executor',
        role: 'Market Sentinel  ·  agent 3',
        title: 'Executor',
        url: REPOSITORY,
        blocked: true,
        sections: [
            {
                accent: ACCENT,
                kicker: 'Order placement',
                title: 'Sizing the model cannot touch',
                lines: [
                    'Position sizing is pure, unit-tested Python: fractional Kelly with hard risk caps. Language models never compute order sizes.',
                    'That sizing engine is exposed as an MCP server, so any client gets the maths while the model cannot alter it.',
                    'PaperBroker simulated portfolio with a JSON ledger. Paper trading only, never real money.',
                    'Walk-forward backtest harness reporting Sharpe ratio, maximum drawdown and win rate against a buy-and-hold benchmark.'
                ],
                chips: [ 'MCP server', 'Fractional Kelly', 'PaperBroker', 'Walk-forward backtest' ]
            }
        ]
    }
]
