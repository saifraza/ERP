# Demo Data for Company Setup

Copy and paste this data into the forms for quick testing:

## Company Information

### Company Details
- **Company Name**: Maharashtra Sugar Mills Pvt Ltd
- **Legal Name**: Maharashtra Sugar Mills Private Limited
- **GST Number**: 27AABCM1234D1ZH
- **PAN Number**: AABCM1234D
- **TAN Number**: PUNE12345D
- **CIN Number**: U15100MH2020PTC123456

### Address
- **Address Line 1**: Plot No. 45, MIDC Industrial Area
- **Address Line 2**: Near Highway Junction
- **City**: Pune
- **State**: Maharashtra
- **Pincode**: 411001

### Contact
- **Email**: info@maharashtrasugar.com
- **Phone**: 9876543210
- **Website**: https://www.maharashtrasugar.com

### Financial Year
- **FY Start Month**: April (already selected)
- **Current FY**: 2024-25

## Factory Information

### Factory 1 - Sugar Mill
- **Factory Name**: Pune Sugar Plant
- **Type**: Sugar Mill
- **Address Line 1**: MIDC Phase 2, Plot 45
- **City**: Pune
- **State**: Maharashtra
- **Pincode**: 411001
- **Crushing Capacity**: 5000
- **Power Capacity**: 25
- **GST Number**: (leave empty - same as company)
- **Factory License**: FL/2024/SUG/001
- **Pollution License**: PCB/2024/MAH/12345

### Factory 2 - Ethanol Plant
- **Factory Name**: Pune Ethanol Division
- **Type**: Ethanol Plant
- **Address Line 1**: MIDC Phase 3, Plot 78
- **City**: Pune
- **State**: Maharashtra
- **Pincode**: 411002
- **Ethanol Capacity**: 100
- **Power Capacity**: 10
- **Factory License**: FL/2024/ETH/002
- **Pollution License**: PCB/2024/MAH/12346

## Quick Copy-Paste Values

### For Company Form:
```
Maharashtra Sugar Mills Pvt Ltd
Maharashtra Sugar Mills Private Limited
27AABCM1234D1ZH
AABCM1234D
PUNE12345D
U15100MH2020PTC123456
Plot No. 45, MIDC Industrial Area
Near Highway Junction
Pune
411001
info@maharashtrasugar.com
9876543210
https://www.maharashtrasugar.com
```

### For Factory 1:
```
Pune Sugar Plant
MIDC Phase 2, Plot 45
Pune
411001
5000
25
FL/2024/SUG/001
PCB/2024/MAH/12345
```

### For Factory 2:
```
Pune Ethanol Division
MIDC Phase 3, Plot 78
Pune
411002
100
10
FL/2024/ETH/002
PCB/2024/MAH/12346
```

## Alternative Test Data Sets

### Test Company 2 - Ethanol Focus
- **Company Name**: Gujarat Ethanol Industries Ltd
- **Legal Name**: Gujarat Ethanol Industries Limited
- **GST Number**: 24AABCG5678E1ZG
- **PAN Number**: AABCG5678E
- **Email**: contact@gujaratethanol.com
- **Phone**: 9988776655

### Test Company 3 - Integrated Unit
- **Company Name**: Karnataka Integrated Sugar Complex
- **Legal Name**: Karnataka Integrated Sugar Complex Pvt Ltd
- **GST Number**: 29AABCK9876F1ZK
- **PAN Number**: AABCK9876F
- **Email**: admin@karnatakasugar.com
- **Phone**: 8899001122

## Tips for Testing

1. **Quick Setup**: Use the first dataset for the quickest setup
2. **Multi-Factory**: Add both factories to test the multi-factory feature
3. **Master Data**: Select "Sugar Industry Standard" template for comprehensive setup
4. **Validation**: All provided numbers follow correct Indian format validations

## Clear Test Data

To clear all test data and start fresh:
1. Open browser console (F12)
2. Run: `localStorage.clear()`
3. Refresh the page

## View Saved Data

To see what's saved:
1. Open browser console (F12)
2. Run: `console.log(JSON.parse(localStorage.getItem('erp-companies')))`