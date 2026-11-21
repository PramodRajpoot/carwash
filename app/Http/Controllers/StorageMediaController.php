<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class StorageMediaController extends Controller
{
    /**
     * Stream or serve public storage files with byte-range and CORS support.
     * Ensures video playback (MP4/WebM) and image rendering work reliably across all domains and IPs.
     */
    public function show(Request $request, $path)
    {
        // Prevent directory traversal attacks
        $cleanPath = ltrim(str_replace(['../', '..\\'], '', $path), '/');

        $candidates = [
            storage_path('app/public/' . $cleanPath),
            public_path('storage/' . $cleanPath),
            storage_path('app/' . $cleanPath),
            public_path($cleanPath),
        ];

        $resolved = null;
        foreach ($candidates as $cand) {
            if (file_exists($cand) && is_file($cand)) {
                $resolved = $cand;
                break;
            }
        }

        if (!$resolved) {
            $stripped = preg_replace('#^public/#', '', $cleanPath);
            $alt = storage_path('app/public/' . $stripped);
            if (file_exists($alt) && is_file($alt)) {
                $resolved = $alt;
            }
        }

        if (!$resolved) {
            return response()->json(['error' => "Media file '{$cleanPath}' not found."], 404);
        }

        $ext = strtolower(pathinfo($resolved, PATHINFO_EXTENSION));
        $mimes = [
            'mp4'  => 'video/mp4',
            'webm' => 'video/webm',
            'ogg'  => 'video/ogg',
            'mov'  => 'video/quicktime',
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif'  => 'image/gif',
            'webp' => 'image/webp',
            'svg'  => 'image/svg+xml',
            'pdf'  => 'application/pdf',
        ];

        $mimeType = $mimes[$ext] ?? (mime_content_type($resolved) ?: 'application/octet-stream');

        $response = new BinaryFileResponse($resolved);
        $response->headers->set('Content-Type', $mimeType);
        $response->headers->set('Accept-Ranges', 'bytes');
        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        $response->headers->set('Cache-Control', 'public, max-age=86400');

        return $response;
    }
}

