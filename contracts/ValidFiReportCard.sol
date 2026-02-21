// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * ValidFi Report Card NFT — Soulbound on Base
 * Each NFT represents a validated Web3 idea with an on-chain score.
 * Non-transferable (soulbound) — proves you validated on ValidFi.
 */
contract ValidFiReportCard is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId;

    struct ReportData {
        string projectName;
        string category;
        string chain;
        uint8 overallScore;
        string verdict;
        uint8 marketScore;
        uint8 tokenomicsScore;
        uint8 techScore;
        uint8 executionScore;
        uint8 timingScore;
        uint256 mintedAt;
    }

    mapping(uint256 => ReportData) public reports;
    // wallet => ideaId => tokenId (prevent duplicate mints)
    mapping(address => mapping(string => uint256)) public mintedReports;

    event ReportMinted(
        address indexed to,
        uint256 indexed tokenId,
        string projectName,
        uint8 overallScore,
        string verdict
    );

    constructor() ERC721("ValidFi Report Card", "VALIDFI") Ownable(msg.sender) {}

    /**
     * Mint a report card NFT. Can be called by anyone (user pays gas).
     * Owner can also mint on behalf of users.
     */
    function mint(
        address to,
        string memory ideaId,
        string memory projectName,
        string memory category,
        string memory chain,
        uint8 overallScore,
        string memory verdict,
        uint8 marketScore,
        uint8 tokenomicsScore,
        uint8 techScore,
        uint8 executionScore,
        uint8 timingScore
    ) external returns (uint256) {
        // Prevent duplicate mints for same idea
        require(mintedReports[to][ideaId] == 0, "Already minted");

        uint256 tokenId = ++_nextTokenId;

        reports[tokenId] = ReportData({
            projectName: projectName,
            category: category,
            chain: chain,
            overallScore: overallScore,
            verdict: verdict,
            marketScore: marketScore,
            tokenomicsScore: tokenomicsScore,
            techScore: techScore,
            executionScore: executionScore,
            timingScore: timingScore,
            mintedAt: block.timestamp
        });

        mintedReports[to][ideaId] = tokenId;
        _safeMint(to, tokenId);

        emit ReportMinted(to, tokenId, projectName, overallScore, verdict);
        return tokenId;
    }

    /**
     * Soulbound: disable all transfers (except mint)
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * Fully on-chain metadata + SVG image
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        ReportData memory r = reports[tokenId];

        string memory scoreColor = r.overallScore >= 75 ? "#4ade80" :
                                   r.overallScore >= 55 ? "#00f0ff" :
                                   r.overallScore >= 35 ? "#fbbf24" : "#ef4444";

        string memory verdictColor = keccak256(bytes(r.verdict)) == keccak256("BULLISH") ? "#4ade80" :
                                     keccak256(bytes(r.verdict)) == keccak256("CAUTIOUS") ? "#fbbf24" :
                                     keccak256(bytes(r.verdict)) == keccak256("BEARISH") ? "#f97316" : "#ef4444";

        // Generate SVG
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">',
            '<defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#06060a"/><stop offset="100%" style="stop-color:#0a0a14"/></linearGradient>',
            '<linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">',
            '<stop offset="0%" style="stop-color:#00f0ff"/><stop offset="100%" style="stop-color:#a855f7"/></linearGradient></defs>',
            '<rect width="400" height="500" fill="url(#bg)" rx="16"/>',
            '<rect x="1" y="1" width="398" height="498" fill="none" stroke="url(#accent)" stroke-width="1" rx="16" opacity="0.3"/>',
            // Header
            '<text x="24" y="36" fill="#00f0ff" font-family="monospace" font-size="10" letter-spacing="3">VALIDFI REPORT CARD</text>',
            '<text x="376" y="36" fill="#a855f7" font-family="monospace" font-size="8" text-anchor="end" letter-spacing="2">ON-CHAIN</text>',
            '<line x1="24" y1="48" x2="376" y2="48" stroke="#00f0ff" stroke-width="0.5" opacity="0.3"/>',
            // Project name
            '<text x="24" y="80" fill="#eeeae2" font-family="sans-serif" font-size="22" font-weight="bold">', r.projectName, '</text>',
            '<text x="24" y="100" fill="#666" font-family="monospace" font-size="10">', r.category, ' | ', r.chain, '</text>'
        ));

        svg = string(abi.encodePacked(svg,
            // Score circle
            '<circle cx="200" cy="180" r="55" fill="none" stroke="#1a1a2e" stroke-width="8"/>',
            '<circle cx="200" cy="180" r="55" fill="none" stroke="', scoreColor, '" stroke-width="8" stroke-dasharray="345" stroke-dashoffset="', uint256(345 - (345 * r.overallScore / 100)).toString(), '" stroke-linecap="round" transform="rotate(-90 200 180)"/>',
            '<text x="200" y="175" fill="', scoreColor, '" font-family="sans-serif" font-size="36" font-weight="bold" text-anchor="middle">', uint256(r.overallScore).toString(), '</text>',
            '<text x="200" y="195" fill="#666" font-family="monospace" font-size="10" text-anchor="middle">/100</text>',
            // Verdict
            '<rect x="150" y="245" width="100" height="24" rx="12" fill="', verdictColor, '" opacity="0.15"/>',
            '<text x="200" y="262" fill="', verdictColor, '" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle" letter-spacing="2">', r.verdict, '</text>'
        ));

        svg = string(abi.encodePacked(svg,
            // Score bars
            _scoreBar("MARKET", r.marketScore, 300),
            _scoreBar("TOKEN", r.tokenomicsScore, 325),
            _scoreBar("TECH", r.techScore, 350),
            _scoreBar("EXEC", r.executionScore, 375),
            _scoreBar("TIMING", r.timingScore, 400),
            // Footer
            '<line x1="24" y1="430" x2="376" y2="430" stroke="#00f0ff" stroke-width="0.5" opacity="0.2"/>',
            '<text x="24" y="455" fill="#333" font-family="monospace" font-size="8" letter-spacing="1">VALIDATED ON BASE</text>',
            '<text x="376" y="455" fill="#333" font-family="monospace" font-size="8" text-anchor="end">SOULBOUND NFT</text>',
            '<text x="200" y="480" fill="#1a1a2e" font-family="monospace" font-size="7" text-anchor="middle">validfi.com | Powered by Elsa x402 + XMTP</text>',
            '</svg>'
        ));

        // Build metadata JSON
        string memory json = string(abi.encodePacked(
            '{"name":"ValidFi: ', r.projectName, '",',
            '"description":"ValidFi Report Card — AI-validated Web3 idea scored ', uint256(r.overallScore).toString(), '/100. Verdict: ', r.verdict, '. Soulbound on Base.",',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
            '"attributes":[',
            '{"trait_type":"Overall Score","value":', uint256(r.overallScore).toString(), '},',
            '{"trait_type":"Verdict","value":"', r.verdict, '"},',
            '{"trait_type":"Category","value":"', r.category, '"},',
            '{"trait_type":"Chain","value":"', r.chain, '"},',
            '{"trait_type":"Market","value":', uint256(r.marketScore).toString(), '},',
            '{"trait_type":"Tokenomics","value":', uint256(r.tokenomicsScore).toString(), '},',
            '{"trait_type":"Tech","value":', uint256(r.techScore).toString(), '},',
            '{"trait_type":"Execution","value":', uint256(r.executionScore).toString(), '},',
            '{"trait_type":"Timing","value":', uint256(r.timingScore).toString(), '}',
            ']}'
        ));

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function _scoreBar(string memory label, uint8 score, uint256 y) internal pure returns (string memory) {
        string memory barColor = score >= 75 ? "#4ade80" : score >= 55 ? "#00f0ff" : score >= 35 ? "#fbbf24" : "#ef4444";
        uint256 barWidth = uint256(score) * 200 / 100;
        return string(abi.encodePacked(
            '<text x="24" y="', y.toString(), '" fill="#555" font-family="monospace" font-size="9">', label, '</text>',
            '<rect x="100" y="', uint256(y - 9).toString(), '" width="200" height="10" rx="5" fill="#1a1a2e"/>',
            '<rect x="100" y="', uint256(y - 9).toString(), '" width="', barWidth.toString(), '" height="10" rx="5" fill="', barColor, '" opacity="0.8"/>',
            '<text x="310" y="', y.toString(), '" fill="#888" font-family="monospace" font-size="9">', uint256(score).toString(), '</text>'
        ));
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }
}
