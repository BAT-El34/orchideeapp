import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductCatalog } from "@/components/modules/products/product-catalog"

export default async function ProduitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("users").select("entity_id").eq("id", user.id).single()
  if (!profile?.entity_id) redirect("/login")

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*, product_categories(id, name), stock(*)").eq("active", true).order("name"),
    supabase.from("product_categories").select("*").order("name"),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-xl font-bold text-gray-900">Catalogue produits</h1>
        <p className="mt-0.5 text-sm text-gray-500">{products?.length ?? 0} produits actifs</p>
      </div>
      <ProductCatalog products={products as any ?? []} categories={categories ?? []} entityId={profile.entity_id} />
    </div>
  )
}
