<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    // Public endpoint — returns active FAQs ordered by sort_order
    public function index()
    {
        $faqs = Faq::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        return response()->json($faqs);
    }

    // Admin endpoint — returns all FAQs
    public function adminIndex()
    {
        $faqs = Faq::orderBy('sort_order')->orderBy('created_at')->get();
        return response()->json($faqs);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:500',
            'answer' => 'required|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $faq = Faq::create([
            'question' => $validated['question'],
            'answer' => $validated['answer'],
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json($faq, 201);
    }

    public function update(Request $request, $id)
    {
        $faq = Faq::findOrFail($id);

        $validated = $request->validate([
            'question' => 'sometimes|string|max:500',
            'answer' => 'sometimes|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['question'])) $faq->question = $validated['question'];
        if (isset($validated['answer'])) $faq->answer = $validated['answer'];
        if (isset($validated['sort_order'])) $faq->sort_order = $validated['sort_order'];
        if (isset($validated['is_active'])) $faq->is_active = $validated['is_active'];

        $faq->save();
        return response()->json($faq);
    }

    public function destroy($id)
    {
        $faq = Faq::findOrFail($id);
        $faq->delete();
        return response()->json(['message' => 'FAQ deleted successfully']);
    }
}
