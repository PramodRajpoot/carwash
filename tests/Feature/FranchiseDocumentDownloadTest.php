<?php

namespace Tests\Feature;

use App\Models\Franchisee;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class FranchiseDocumentDownloadTest extends TestCase
{
    use DatabaseTransactions;

    protected User $superAdmin;
    protected Franchisee $franchisee;
    protected string $testPdfPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'role'  => 'super_admin',
            'email' => 'superadmintest_docs@carwash.com',
        ]);

        $franchiseeUser = User::factory()->create(['role' => 'franchisee']);
        $this->franchisee = Franchisee::create([
            'user_id'            => $franchiseeUser->id,
            'center_name'        => 'Test Center Docs',
            'address'            => 'Test Address',
            'city'               => 'Mumbai',
            'state'              => 'Maharashtra',
            'pincode'            => '400001',
            'contact_number'     => '9999900000',
            'royalty_percentage' => 10.00,
            'status'             => 'active',
        ]);

        // Create a dummy test PDF file in public/franchise_documents
        $dir = public_path('franchise_documents');
        if (!file_exists($dir)) {
            @mkdir($dir, 0777, true);
        }

        $filename = 'test_sample_' . time() . '.pdf';
        $this->testPdfPath = $dir . '/' . $filename;
        file_put_contents($this->testPdfPath, "%PDF-1.4 sample pdf content for testing");

        $this->franchisee->documents = [
            [
                'id'          => 'doc_test_123',
                'name'        => 'SampleDocument.pdf',
                'path'        => 'franchise_documents/' . $filename,
                'uploaded_at' => now()->toDateTimeString(),
                'size'        => filesize($this->testPdfPath),
            ]
        ];
        $this->franchisee->save();
    }

    protected function tearDown(): void
    {
        if (isset($this->testPdfPath) && file_exists($this->testPdfPath)) {
            @unlink($this->testPdfPath);
        }
        parent::tearDown();
    }

    public function test_admin_can_download_franchise_document()
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/admin/franchisees/{$this->franchisee->id}/documents/download?doc_id=doc_test_123");

        $response->assertStatus(200);
        $this->assertTrue(str_contains($response->headers->get('content-disposition'), 'attachment'));
        $this->assertTrue(str_contains($response->headers->get('content-disposition'), 'SampleDocument.pdf'));
        $this->assertEquals('%PDF-1.4 sample pdf content for testing', file_get_contents($response->getFile()->getPathname()));
    }

    public function test_admin_can_view_franchise_document_inline()
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->get("/api/admin/franchisees/{$this->franchisee->id}/documents/view?doc_id=doc_test_123");

        $response->assertStatus(200);
        $this->assertTrue(str_contains($response->headers->get('content-disposition'), 'inline'));
    }

    public function test_direct_franchise_documents_web_route_serves_file()
    {
        $filename = basename($this->testPdfPath);
        $response = $this->get("/franchise_documents/{$filename}?download=1");

        $response->assertStatus(200);
        $this->assertTrue(str_contains($response->headers->get('content-disposition'), 'attachment'));
    }

    public function test_non_existent_document_returns_404_json_instead_of_html()
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/admin/franchisees/{$this->franchisee->id}/documents/download?doc_id=non_existent_id&path=franchise_documents/notfound.pdf");

        $response->assertStatus(404);
        $response->assertJsonStructure(['status', 'message']);
        $this->assertEquals('error', $response->json('status'));
    }
}
