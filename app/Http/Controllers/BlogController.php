<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BlogPost;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    // Public: list published posts
    public function index()
    {
        $posts = BlogPost::with('author:id,name')
            ->where('status', 'published')
            ->orderBy('published_at', 'desc')
            ->get(['id', 'title', 'slug', 'featured_image', 'published_at', 'author_id']);

        return response()->json($posts);
    }

    // Public: single post by slug
    public function show($slug)
    {
        $post = BlogPost::with('author:id,name')
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        return response()->json($post);
    }

    // Admin: list all (draft + published)
    public function adminIndex()
    {
        $posts = BlogPost::with('author:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($posts);
    }

    // Admin: create post
    public function store(Request $request)
    {
        $request->validate([
            'title'           => 'required|string|max:255',
            'content'         => 'required|string',
            'status'          => 'nullable|in:draft,published',
            'featured_image'  => 'nullable|file|image|max:5120',
        ]);

        $slug = Str::slug($request->title);
        $originalSlug = $slug;
        $i = 1;
        while (BlogPost::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $i++;
        }

        $imagePath = null;
        if ($request->hasFile('featured_image')) {
            $imagePath = $request->file('featured_image')->store('blog/images', 'public');
        }

        $post = BlogPost::create([
            'author_id'      => $request->user()->id,
            'title'          => $request->title,
            'slug'           => $slug,
            'content'        => $request->content,
            'featured_image' => $imagePath,
            'status'         => $request->input('status', 'draft'),
            'published_at'   => $request->status === 'published' ? now() : null,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Blog post created.',
            'post'    => $post,
        ], 201);
    }

    // Admin: update post
    public function update(Request $request, $id)
    {
        $post = BlogPost::findOrFail($id);

        $request->validate([
            'title'   => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'status'  => 'nullable|in:draft,published',
        ]);

        $post->update([
            'title'        => $request->input('title', $post->title),
            'content'      => $request->input('content', $post->content),
            'status'       => $request->input('status', $post->status),
            'published_at' => ($request->status === 'published' && !$post->published_at) ? now() : $post->published_at,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Blog post updated.',
            'post'    => $post,
        ]);
    }

    // Admin: delete post
    public function destroy($id)
    {
        BlogPost::findOrFail($id)->delete();

        return response()->json(['status' => 'success', 'message' => 'Post deleted.']);
    }
}
