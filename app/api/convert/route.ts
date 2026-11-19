import { NextRequest, NextResponse } from 'next/server';
import { parseSumberExcel, generateOtherPaymentWorkbook, ConversionOptions, DEFAULT_OPTIONS } from '@/lib/converter';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const optionsStr = formData.get('options') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File Excel harus diunggah.' }, { status: 400 });
    }

    const options: ConversionOptions = optionsStr
      ? { ...DEFAULT_OPTIONS, ...JSON.parse(optionsStr) }
      : DEFAULT_OPTIONS;

    const arrayBuffer = await file.arrayBuffer();
    const { rows, groups, summary } = await parseSumberExcel(arrayBuffer);

    const wb = await generateOtherPaymentWorkbook(groups, options);
    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="OtherPayment_Converted_${Date.now()}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat mengkonversi file.' },
      { status: 500 }
    );
  }
}
