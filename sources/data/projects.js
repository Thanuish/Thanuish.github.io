/**
 * Projects shown on the boards.
 *
 * Boards are text cards drawn at runtime (see utilities/projectCard.js), so
 * `cards` replaces the original `images` array of screenshot filenames. Every
 * claim here comes from the master profile; nothing is embellished.
 *
 * `attributes` is deliberately thin. The original carried agency and
 * collaborator credits that mean nothing here, so only `role` is used.
 * `distinctions` stays empty, which hides the award medals.
 */

const ACCENT_VISION = '#5fd2ff'
const ACCENT_AI = '#b65fff'
const ACCENT_SOFTWARE = '#ff8039'
const ACCENT_DATA = '#a2ffab'

export default [
    {
        title: 'Multimodal Deepfake Detection',
        titleSmall: [ 'Deepfake', 'Detection' ],
        attributes: { role: "Bachelor's thesis, sole developer" },
        distinctions: [],
        cards: [
            {
                accent: ACCENT_VISION,
                kicker: "Bachelor's thesis  ·  Aug 2023 - Apr 2024",
                title: 'Detecting manipulated video and audio',
                lines: [
                    'Sole developer. Learned deep learning from scratch and delivered a working end to end system in roughly three months.',
                    'Handled 140GB+ of video and image data from FaceForensics++ and DeepFakeDetection.',
                    '20+ hours of audio from ASVspoof, WaveFake and Fake-or-Real.',
                    'Optimised preprocessing to cut runtime by 35%.'
                ],
                chips: [ 'Python', 'TensorFlow', 'Keras', 'OpenCV' ]
            },
            {
                accent: ACCENT_VISION,
                kicker: 'Pipeline',
                title: 'Two modules, cascading stages',
                lines: [
                    'Image and video: MTCNN face detection, then Inception-ResNet feature extraction, then KNN classification.',
                    'Improved detection accuracy 12.4% over standalone models.',
                    'Audio: MFCC features and spectrograms via Librosa, a dual stage XAI-CNN plus LSTM pipeline, classified with SVM and Random Forest.'
                ],
                chips: [ 'MTCNN', 'Inception-ResNet', 'KNN', 'LSTM', 'SVM', 'Random Forest', 'Librosa' ]
            },
            {
                accent: ACCENT_VISION,
                kicker: 'Results',
                title: '91.7% overall accuracy',
                lines: [
                    'F1 score 0.89 on the image and video module.',
                    '92.1% accuracy on the audio module under 5-fold cross validation.',
                    'Grad-CAM and SHAP interpretability applied to explain decisions and drive error analysis.'
                ],
                chips: [ 'Grad-CAM', 'SHAP', 'Albumentations' ]
            }
        ]
    },
    {
        title: 'Market Sentinel',
        titleSmall: [ 'Market', 'Sentinel' ],
        url: 'https://github.com/Thanuish/Market_sentinal',
        attributes: { role: 'Personal research project' },
        distinctions: [],
        cards: [
            {
                accent: ACCENT_AI,
                kicker: 'Multi-agent research system',
                title: 'Paper trading with a hard execution boundary',
                lines: [
                    'A LangGraph state machine with three agents: Watchdog runs a deterministic RSI and MACD technical screen, Evaluator is a retrieval augmented risk gate, Executor places orders.',
                    'Paper trading only. No real money, ever.',
                    'Market data via yfinance, daily bars, US equities.'
                ],
                chips: [ 'Python', 'LangGraph', 'MCP', 'yfinance' ]
            },
            {
                accent: ACCENT_AI,
                kicker: 'The point of the project',
                title: 'The gate is code, not a prompt',
                lines: [
                    'The order execution path is structurally unreachable until the Evaluator writes an explicit approval into graph state.',
                    'Gating is enforced by the state machine, not by prompt instruction.',
                    'Position sizing is pure, unit tested Python: fractional Kelly with hard risk caps. Language models never compute order sizes.',
                    'That sizing engine is exposed as an MCP server, so any client gets the maths while the model cannot alter it.'
                ],
                chips: [ 'State machine gating', 'Fractional Kelly', 'MCP server' ]
            },
            {
                accent: ACCENT_AI,
                kicker: 'Evaluation',
                title: 'Twelve tests, one of them a proof',
                lines: [
                    '12 pytest tests: 5 on gate enforcement, 7 on sizing, including a proof that the executor refuses unapproved signals.',
                    'Walk forward backtest harness reporting Sharpe ratio, maximum drawdown and win rate against a buy and hold benchmark.',
                    'RAG retrieval from a local corpus of news and filings notes with keyword sentiment scoring.',
                    'Offline first: a synthetic data generator means it runs with no API keys.'
                ],
                chips: [ 'pytest', 'RAG', 'PaperBroker', 'JSON ledger' ]
            }
        ]
    },
    {
        title: 'Sentiment Transfer in Movie Reviews',
        titleSmall: [ 'Sentiment', 'Transfer' ],
        attributes: { role: 'University of Stuttgart research' },
        distinctions: [],
        cards: [
            {
                accent: ACCENT_AI,
                kicker: 'Research project  ·  2024 - 2025',
                title: 'Baseline, fine-tuned, then prompted',
                lines: [
                    'Trained n-gram language models as a classical statistical baseline for review generation.',
                    'Fine-tuned T5 and FLAN-T5 with Hugging Face Transformers for supervised sentiment transfer.',
                    'Ran LLaMA 3 locally through Ollama with a prompt based in-context approach.',
                    'The prompted model outperformed the fine-tuned ones on polarity flipping under low-resource conditions.'
                ],
                chips: [ 'T5', 'FLAN-T5', 'LLaMA 3', 'Ollama', 'Hugging Face' ]
            },
            {
                accent: ACCENT_AI,
                kicker: 'Dataset and evaluation',
                title: 'Built the data, then measured honestly',
                lines: [
                    'Designed and built a parallel sentiment transfer dataset of 147 paired reviews using manual annotation, web scraping and back-translation augmentation.',
                    'Evaluated with BLEU, sentiment scoring and cosine similarity embeddings via Sentence-Transformers, measuring both transfer success and content preservation.',
                    'Structured human evaluation with 50+ annotators.',
                    'Qualitative error analysis on the accuracy versus content preservation trade-off.'
                ],
                chips: [ 'BLEU', 'Sentence-Transformers', 'Prompt engineering' ]
            }
        ]
    },
    {
        title: 'VisionARyMenu',
        titleSmall: [ 'VisionAR', 'yMenu' ],
        attributes: { role: 'Android AR application' },
        distinctions: [],
        cards: [
            {
                accent: ACCENT_SOFTWARE,
                kicker: 'Augmented reality  ·  2026',
                title: 'One build, many restaurants',
                lines: [
                    'Independently ported an existing iOS and ARKit application to Android, integrating ARCore and AR Foundation for plane detection and 3D model placement, verified on physical hardware.',
                    'QR triggered remote content: decodes table QR codes from live camera frames, fetches a restaurant specific JSON catalog over HTTP and renders it as a tappable AR menu.',
                    'No hardcoded content and no per client rebuilds.'
                ],
                chips: [ 'Unity', 'C#', 'ARCore', 'AR Foundation', 'ZXing.Net' ]
            },
            {
                accent: ACCENT_SOFTWARE,
                kicker: 'Engineering practice',
                title: 'Graceful failure and real review',
                lines: [
                    'Designed a fallback rendering pipeline using procedural geometry for catalog items without a bundled 3D model, so missing assets degrade instead of crashing.',
                    'Developed with Git and GitHub branching, pull requests, code review and NUnit unit tests.'
                ],
                chips: [ 'glTFast', 'NUnit', 'Git' ]
            }
        ]
    },
    {
        title: 'Helmet Detection & Plate Recognition',
        titleSmall: [ 'Helmet', 'Detection' ],
        attributes: { role: 'Computer vision project' },
        distinctions: [],
        cards: [
            {
                accent: ACCENT_VISION,
                kicker: 'Real-time detection',
                title: 'Riders, helmets and licence plates',
                lines: [
                    'Trained and deployed YOLOv6 for multi-class real time object detection: motorcycle, rider and helmet status, in a live inference pipeline.',
                    'Built an ROI cropping and OCR pipeline for licence plate extraction.',
                    'Evaluated detection accuracy and iterated for robustness across real world lighting and angle conditions.'
                ],
                chips: [ 'Python', 'YOLOv6', 'OpenCV', 'Tesseract', 'EasyOCR' ]
            }
        ]
    },
    {
        title: 'Academic Collocation Query Tool',
        titleSmall: [ 'Collocation', 'Tool' ],
        attributes: { role: 'University of Stuttgart project' },
        distinctions: [],
        cards: [
            {
                accent: ACCENT_DATA,
                kicker: 'Scrape, transform, load, query',
                title: 'An end to end data pipeline',
                lines: [
                    'Building a searchable academic collocation resource from real IELTS style academic texts.',
                    'Web scraping HTML based academic texts with BeautifulSoup to gather source material.',
                    'Transforming and cleaning XML exported from Sketch Engine using XSLT.',
                    'Structuring the cleaned data into a SQLite relational database, modelled for fast querying by word, part of speech and example.'
                ],
                chips: [ 'Python', 'BeautifulSoup', 'XSLT', 'XML', 'SQL', 'SQLite' ]
            }
        ]
    },
    {
        title: 'JOBB HUNTT',
        titleSmall: [ 'JOBB', 'HUNTT' ],
        attributes: { role: 'Personal tooling' },
        distinctions: [],
        cards: [
            {
                accent: ACCENT_DATA,
                kicker: 'Personal tooling',
                title: 'An AI-assisted job application system',
                lines: [
                    'Tooling built for my own job search: tailoring application documents against a role and keeping track of what was sent where.',
                    'Built and used daily rather than written up as a showcase.'
                ],
                chips: [ 'Python', 'LLM tooling' ]
            }
        ]
    }
]
