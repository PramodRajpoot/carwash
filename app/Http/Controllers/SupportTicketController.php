<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use App\Models\SupportTicket;

class SupportTicketController extends Controller
{
    // Customer: list own tickets
    public function index(Request $request)
    {
        $tickets = SupportTicket::where('customer_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tickets);
    }

    // Customer: create ticket
    public function store(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'body'    => 'required|string',
            'image'   => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = 'ticket_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/tickets');
            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0777, true, true);
            }
            $file->move($destinationPath, $filename);
            $imagePath = '/uploads/tickets/' . $filename;
        }

        $ticket = SupportTicket::create([
            'customer_id' => $request->user()->id,
            'subject'     => $request->subject,
            'body'        => $request->body,
            'image'       => $imagePath,
            'status'      => 'open',
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Support ticket created successfully.',
            'ticket'  => $ticket,
        ], 201);
    }

    // Customer: view single ticket
    public function show(Request $request, $id)
    {
        $ticket = SupportTicket::where('customer_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($ticket);
    }

    // Admin: list all tickets
    public function adminIndex(Request $request)
    {
        $tickets = SupportTicket::with('customer:id,name,email,phone')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tickets);
    }

    // Admin: reply and change status
    public function adminUpdate(Request $request, $id)
    {
        $ticket = SupportTicket::findOrFail($id);

        $request->validate([
            'status'      => 'nullable|string|in:open,in_progress,closed',
            'admin_reply' => 'nullable|string',
            'reply_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        $data = [];
        if ($request->has('status')) {
            $data['status'] = $request->input('status');
        }
        if ($request->filled('admin_reply')) {
            $data['admin_reply'] = $request->admin_reply;
            $data['replied_at'] = now();
        }
        if ($request->hasFile('reply_image')) {
            $file = $request->file('reply_image');
            $filename = 'reply_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/tickets');
            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0777, true, true);
            }
            $file->move($destinationPath, $filename);
            $data['reply_image'] = '/uploads/tickets/' . $filename;
        }

        $ticket->update($data);

        return response()->json([
            'status'  => 'success',
            'message' => 'Ticket updated.',
            'ticket'  => $ticket->load('customer:id,name,email,phone'),
        ]);
    }
}
