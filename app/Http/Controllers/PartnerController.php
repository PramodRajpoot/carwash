<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PartnerInquiry;

class PartnerController extends Controller
{
    // Public: submit partner application
    public function store(Request $request)
    {
        $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255',
            'phone'   => 'required|string|max:20',
            'city'    => 'required|string|max:100',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'budget'  => 'nullable|string|max:50',
            'message' => 'nullable|string|max:2000',
        ]);

        // Prevent duplicate same-email submissions within 7 days
        $recent = PartnerInquiry::where('email', $request->email)
            ->where('created_at', '>=', now()->subDays(7))
            ->first();

        if ($recent) {
            return response()->json([
                'status'  => 'error',
                'message' => 'An application from this email was already submitted recently. Our team will contact you within 48 hours.',
            ], 409);
        }

        $inquiry = PartnerInquiry::create([
            'name'    => $request->name,
            'email'   => $request->email,
            'phone'   => $request->phone,
            'city'    => $request->city,
            'latitude'=> $request->latitude,
            'longitude'=> $request->longitude,
            'budget'  => $request->budget,
            'message' => $request->message,
            'status'  => 'new',
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Application submitted successfully! Our team will contact you within 48 hours.',
            'id'      => $inquiry->id,
        ], 201);
    }

    // Admin: list all inquiries
    public function adminIndex(Request $request)
    {
        $status = $request->input('status');

        $query = PartnerInquiry::orderBy('created_at', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        $inquiries = $query->get();

        $stats = [
            'total'     => PartnerInquiry::count(),
            'new'       => PartnerInquiry::where('status', 'new')->count(),
            'contacted' => PartnerInquiry::where('status', 'contacted')->count(),
            'approved'  => PartnerInquiry::where('status', 'approved')->count(),
            'rejected'  => PartnerInquiry::where('status', 'rejected')->count(),
        ];

        return response()->json([
            'inquiries' => $inquiries,
            'stats'     => $stats,
        ]);
    }

    // Admin: update status / add notes
    public function adminUpdate(Request $request, $id)
    {
        $inquiry = PartnerInquiry::findOrFail($id);

        $request->validate([
            'status'      => 'nullable|in:new,contacted,approved,rejected',
            'admin_notes' => 'nullable|string|max:2000',
        ]);

        $data = [];
        $generatedPassword = null;

        if ($request->filled('status')) {
            $data['status'] = $request->status;
            if ($request->status === 'contacted' && !$inquiry->contacted_at) {
                $data['contacted_at'] = now();
            }

            // Auto-create franchisee if approved
            if ($request->status === 'approved' && $inquiry->status !== 'approved') {
                $userExists = \App\Models\User::where('email', $inquiry->email)->first();
                if (!$userExists) {
                    $generatedPassword = \Illuminate\Support\Str::random(8);
                    
                    $user = \App\Models\User::create([
                        'name' => $inquiry->name,
                        'email' => $inquiry->email,
                        'phone' => $inquiry->phone,
                        'password' => \Illuminate\Support\Facades\Hash::make($generatedPassword),
                        'role' => 'franchisee',
                        'status' => 'active'
                    ]);

                    \App\Models\Franchisee::create([
                        'user_id' => $user->id,
                        'center_name' => $inquiry->name . "'s Center",
                        'address' => 'Pending Setup',
                        'city' => $inquiry->city ?? 'Pending Setup',
                        'latitude' => $inquiry->latitude,
                        'longitude' => $inquiry->longitude,
                        'royalty_percentage' => 10.0,
                        'status' => 'active'
                    ]);
                }
            }
        }

        if ($request->filled('admin_notes')) {
            $data['admin_notes'] = $request->admin_notes;
        }

        $inquiry->update($data);

        $response = [
            'status'  => 'success',
            'message' => 'Inquiry updated.',
            'inquiry' => $inquiry->fresh(),
        ];

        if ($generatedPassword) {
            $response['generated_password'] = $generatedPassword;
            $response['message'] = 'Inquiry approved and Franchisee account created automatically.';
        }

        return response()->json($response);
    }

    // Admin: delete inquiry
    public function adminDestroy($id)
    {
        PartnerInquiry::findOrFail($id)->delete();
        return response()->json(['status' => 'success', 'message' => 'Inquiry deleted.']);
    }
}
