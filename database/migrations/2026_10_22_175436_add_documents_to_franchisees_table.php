<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('franchisees') && !Schema::hasColumn('franchisees', 'documents')) {
            Schema::table('franchisees', function (Blueprint $table) {
                $table->json('documents')->nullable()->after('document_path');
            });

            // Migrate existing single document_path to documents array
            $franchisees = \Illuminate\Support\Facades\DB::table('franchisees')
                ->whereNotNull('document_path')
                ->where('document_path', '!=', '')
                ->get();

            foreach ($franchisees as $f) {
                $filename = basename($f->document_path);
                $docs = [
                    [
                        'id' => time() . '_1',
                        'name' => $filename,
                        'path' => $f->document_path,
                        'uploaded_at' => now()->toDateTimeString(),
                    ]
                ];
                \Illuminate\Support\Facades\DB::table('franchisees')
                    ->where('id', $f->id)
                    ->update(['documents' => json_encode($docs)]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('franchisees') && Schema::hasColumn('franchisees', 'documents')) {
            Schema::table('franchisees', function (Blueprint $table) {
                $table->dropColumn('documents');
            });
        }
    }
};
